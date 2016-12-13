// @flow
import ArrayBufferCursor from './ArrayBufferCursor';

class Context {
    src: ArrayBufferCursor;
    dst: ArrayBufferCursor;
    flags: number;
    bit_pos: number;

    constructor(cursor: ArrayBufferCursor) {
        this.src = cursor;
        this.dst = new ArrayBufferCursor(4 * cursor.size, true);
        this.flags = 0;
        this.bit_pos = 0;
    }

    read_flag_bit() {
        // Fetch a new flag byte when the previous byte has been processed.
        if (this.bit_pos === 0) {
            this.flags = this.read_byte();
            this.bit_pos = 8;
        }

        let rv = this.flags & 1;
        this.flags >>>= 1;
        this.bit_pos -= 1;
        return rv;
    }

    copy_byte() {
        this.dst.write_u8(this.read_byte());
    }

    read_byte() {
        return this.src.u8();
    }

    read_short() {
        return this.src.u16();
    }

    offset_copy(offset, size) {
        if (offset < -8192 || offset > 0) {
            console.error(`Offset was ${offset}, should be between -8192 and 0.`);
        }

        if (size < 1 || size > 256) {
            console.error(`Size was ${size}, should be between 1 and 256.`);
        }

        // The size can be larger than -offset, in that case we copy -offset bytes size/-offset times.
        const buf_size = Math.min(-offset, size);

        this.dst.seek(offset);
        const buf = this.dst.take(buf_size);
        this.dst.seek(-offset - buf_size);

        for (let i = 0; i < Math.floor(size / buf_size); ++i) {
            this.dst.write_cursor(buf);
        }

        this.dst.write_cursor(buf.take(size % buf_size));
    }
}

export function decompress(cursor: ArrayBufferCursor) {
    const ctx = new Context(cursor);

    while (true) {
        if (ctx.read_flag_bit() === 1) {
            // Single byte copy.
            ctx.copy_byte();
        } else {
            // Multi byte copy.
            let size;
            let offset;

            if (ctx.read_flag_bit() === 0) {
                // Short copy.
                size = ctx.read_flag_bit() << 1;
                size |= ctx.read_flag_bit();
                size += 2;

                offset = ctx.read_byte() - 256;
            } else {
                // Long copy or end of file.
                offset = ctx.read_short();

                // Two zero bytes implies that this is the end of the file.
                if (offset === 0) {
                    break;
                }

                // Do we need to read a size byte, or is it encoded in what we already have?
                size = offset & 0b111;
                offset >>>= 3;

                if (size === 0) {
                    size = ctx.read_byte();
                    size += 1;
                } else {
                    size += 2;
                }

                offset -= 8192;
            }

            ctx.offset_copy(offset, size);
        }
    }

    return ctx.dst.seek_start(0);
}
