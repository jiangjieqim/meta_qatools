let TWO_PWR_16_DBL = 1 << 16;

let TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
let TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
let pow_dbl = Math.pow; // Used 4 times (4*8 to 15+4)
let INT_CACHE = {};
let wasm = null;
let UINT_CACHE = {};


function isLong(obj) {
    return (obj && obj["__isLong__"]) === true;
}
function fromString(str, unsigned = undefined, radix = undefined) {
    if (str.length === 0) throw Error('empty string');

    if (typeof unsigned === 'number') {
        // For goog.math.long compatibility
        radix = unsigned;
        unsigned = false;
    } else {
        unsigned = !!unsigned;
    }

    if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity") return unsigned ? UZERO : ZERO;
    radix = radix || 10;
    if (radix < 2 || 36 < radix) throw RangeError('radix');
    var p;
    if ((p = str.indexOf('-')) > 0) throw Error('interior hyphen'); else if (p === 0) {
        return fromString(str.substring(1), unsigned, radix).neg();
    } // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.

    var radixToPower = fromNumber(pow_dbl(radix, 8));
    var result = ZERO;

    for (var i = 0; i < str.length; i += 8) {
        var size = Math.min(8, str.length - i),
            value = parseInt(str.substring(i, i + size), radix);

        if (size < 8) {
            var power = fromNumber(pow_dbl(radix, size));
            result = result.mul(power).add(fromNumber(value));
        } else {
            result = result.mul(radixToPower);
            result = result.add(fromNumber(value));
        }
    }

    result.unsigned = unsigned;
    return result;
}

function fromValue(val, unsigned = false) {
    if (typeof val === 'number') return fromNumber(val, unsigned);
    if (typeof val === 'string') return fromString(val, unsigned); // Throws for non-objects, converts non-instanceof Long:

    return fromBits(val.low, val.high, typeof unsigned === 'boolean' ? unsigned : val.unsigned);
}
function fromInt(value, unsigned = false) {
    var obj, cachedObj, cache;

    if (unsigned) {
        value >>>= 0;

        if (cache = 0 <= value && value < 256) {
            cachedObj = UINT_CACHE[value];
            if (cachedObj) return cachedObj;
        }

        obj = fromBits(value, 0, true);
        if (cache) UINT_CACHE[value] = obj;
        return obj;
    } else {
        value |= 0;

        if (cache = -128 <= value && value < 128) {
            cachedObj = INT_CACHE[value];
            if (cachedObj) return cachedObj;
        }

        obj = fromBits(value, value < 0 ? -1 : 0, false);
        if (cache) INT_CACHE[value] = obj;
        return obj;
    }
}
var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;

function fromNumber(value, unsigned = false) {
    if (isNaN(value)) return unsigned ? UZERO : ZERO;

    if (unsigned) {
        if (value < 0) return UZERO;
        if (value >= TWO_PWR_64_DBL) return MAX_UNSIGNED_VALUE;
    } else {
        if (value <= -TWO_PWR_63_DBL) return MIN_VALUE;
        if (value + 1 >= TWO_PWR_63_DBL) return MAX_VALUE;
    }

    if (value < 0) return fromNumber(-value, unsigned).neg();
    return fromBits(value % TWO_PWR_32_DBL | 0, value / TWO_PWR_32_DBL | 0, unsigned);
}

export class uint64 {

    public low: number;
    public high: number;
    private unsigned: boolean = true;
    constructor(low: number = 0, high: number = 0, unsigned = true) {
        this.low = low;
        this.high = high;
        this.unsigned = !!unsigned;
    }
    public isZero() {
        return this.high === 0 && this.low === 0;
    }
    // LongPrototype.eq = LongPrototype.equals;
    private eq(other) {
        return this.equals(other);
    }

    /**
     * 是否相等
     */
    public equals(other) {
        if (!isLong(other)) other = fromValue(other);
        if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1) return false;
        return this.high === other.high && this.low === other.low;
    };

    private div(divisor) {
        return this.divide(divisor);
    }
    private shiftRight(numBits) {
        if (isLong(numBits)) numBits = numBits.toInt();
        if ((numBits &= 63) === 0) return this;else if (numBits < 32) return fromBits(this.low >>> numBits | this.high << 32 - numBits, this.high >> numBits, this.unsigned);else return fromBits(this.high >> numBits - 32, this.high >= 0 ? 0 : -1, this.unsigned);
    }
    private shr(n){
        return this.shiftRight(n);
    }
    private add(addend) {
        if (!isLong(addend)) addend = fromValue(addend); // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
      
        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;
        var b48 = addend.high >>> 16;
        var b32 = addend.high & 0xFFFF;
        var b16 = addend.low >>> 16;
        var b00 = addend.low & 0xFFFF;
        var c48 = 0,
            c32 = 0,
            c16 = 0,
            c00 = 0;
        c00 += a00 + b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 + b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 + b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 + b48;
        c48 &= 0xFFFF;
        return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
    };
    private sub(subtrahend) {
        if (!isLong(subtrahend)) subtrahend = fromValue(subtrahend);
        return this.add(subtrahend.neg());
    };
    private not() {
        return fromBits(~this.low, ~this.high, this.unsigned);
      };
    private neg() {
        if (!this.unsigned && this.eq(MIN_VALUE)) return MIN_VALUE;
        return this.not().add(ONE);
      };

    private shru(numBits) {
    if (isLong(numBits)) numBits = numBits.toInt();
    if ((numBits &= 63) === 0) return this;
    if (numBits < 32) return fromBits(this.low >>> numBits | this.high << 32 - numBits, this.high >>> numBits, this.unsigned);
    if (numBits === 32) return fromBits(this.high, 0, this.unsigned);
    return fromBits(this.high >>> numBits - 32, 0, this.unsigned);
    };
 
    private divide(divisor) {
        if (!isLong(divisor)) divisor = fromValue(divisor);
        if (divisor.isZero()) throw Error('division by zero'); // use wasm support if present

        if (wasm) {
            // guard against signed division overflow: the largest
            // negative number / -1 would be 1 larger than the largest
            // positive number, due to two's complement.
            if (!this.unsigned && this.high === -0x80000000 && divisor.low === -1 && divisor.high === -1) {
                // be consistent with non-wasm code path
                return this;
            }

            var low = (this.unsigned ? wasm["div_u"] : wasm["div_s"])(this.low, this.high, divisor.low, divisor.high);
            return fromBits(low, wasm["get_high"](), this.unsigned);
        }

        if (this.isZero()) return this.unsigned ? UZERO : ZERO;
        var approx, rem, res;

        if (!this.unsigned) {
            // This section is only relevant for signed longs and is derived from the
            // closure library as a whole.
            if (this.eq(MIN_VALUE)) {
                if (divisor.eq(ONE) || divisor.eq(NEG_ONE)) return MIN_VALUE; // recall that -MIN_VALUE == MIN_VALUE
                else if (divisor.eq(MIN_VALUE)) return ONE; else {
                    // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
                    var halfThis = this.shr(1);
                    approx = halfThis.div(divisor).shl(1);

                    if (approx.eq(ZERO)) {
                        return divisor.isNegative() ? ONE : NEG_ONE;
                    } else {
                        rem = this.sub(divisor.mul(approx));
                        res = approx.add(rem.div(divisor));
                        return res;
                    }
                }
            } else if (divisor.eq(MIN_VALUE)) return this.unsigned ? UZERO : ZERO;

            if (this.isNegative()) {
                if (divisor.isNegative()) return this.neg().div(divisor.neg());
                return this.neg().div(divisor).neg();
            } else if (divisor.isNegative()) return this.div(divisor.neg()).neg();

            res = ZERO;
        } else {
            // The algorithm below has not been made for unsigned longs. It's therefore
            // required to take special care of the MSB prior to running it.
            if (!divisor.unsigned) divisor = divisor.toUnsigned();
            if (divisor.gt(this)) return UZERO;
            if (divisor.gt(this.shru(1))) // 15 >>> 1 = 7 ; with divisor = 8 ; true
                return UONE;
            res = UZERO;
        } // Repeat the following until the remainder is less than other:  find a
        // floating-point that approximates remainder / other *from below*, add this
        // into the result, and subtract it from the remainder.  It is critical that
        // the approximate value is less than or equal to the real value so that the
        // remainder never becomes negative.


        rem = this;

        while (rem.gte(divisor)) {
            // Approximate the result of division. This may be a little greater or
            // smaller than the actual value.
            approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber())); // We will tweak the approximate result by changing it in the 48-th digit or
            // the smallest non-fractional digit, whichever is larger.

            var log2 = Math.ceil(Math.log(approx) / Math.LN2),
                delta = log2 <= 48 ? 1 : pow_dbl(2, log2 - 48),
                // Decrease the approximation until it is smaller than the remainder.  Note
                // that if it is too large, the product overflows and is negative.
                approxRes = fromNumber(approx),
                approxRem = approxRes.mul(divisor);

            while (approxRem.isNegative() || approxRem.gt(rem)) {
                approx -= delta;
                approxRes = fromNumber(approx, this.unsigned);
                approxRem = approxRes.mul(divisor);
            } // We know the answer can't be zero... and actually, zero would cause
            // infinite recursion since we would make no progress.


            if (approxRes.isZero()) approxRes = ONE;
            res = res.add(approxRes);
            rem = rem.sub(approxRem);
        }

        return res;
    };
    private toInt() {
        return this.unsigned ? this.low >>> 0 : this.low;
    };

    /**
     * 转字符串
     */
    public toString(radix=undefined) {
        radix = radix || 10;
        if (radix < 2 || 36 < radix) throw RangeError('radix');
        if (this.isZero()) return '0';

        if (this.isNegative()) {
            // Unsigned Longs are never negative
            if (this.eq(MIN_VALUE)) {
                // We need to change the Long value before it can be negated, so we remove
                // the bottom-most digit in this base and then recurse to do the rest.
                var radixLong = fromNumber(radix),
                    div = this.div(radixLong),
                    rem1 = div.mul(radixLong).sub(this);
                return div.toString(radix) + rem1.toInt().toString(radix);
            } else return '-' + this.neg().toString(radix);
        } // Do several (6) digits each time through the loop, so as to
        // minimize the calls to the very expensive emulated div.


        var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned),
            rem = this;
        var result = '';

        while (true) {
            var remDiv = rem.div(radixToPower),
                intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0,
                digits = intval.toString(radix);
            rem = remDiv;
            if (rem.isZero()) return digits + result; else {
                while (digits.length < 6) digits = '0' + digits;

                result = '' + digits + result;
            }
        }
    }

    private isNegative() {
        return !this.unsigned && this.high < 0;
    }
    private toUnsigned() {
        if (this.unsigned) return this;
        return fromBits(this.low, this.high, true);
      };
      private comp(other) {
        if (!isLong(other)) other = fromValue(other);
        if (this.eq(other)) return 0;
        var thisNeg = this.isNegative(),
            otherNeg = other.isNegative();
        if (thisNeg && !otherNeg) return -1;
        if (!thisNeg && otherNeg) return 1; // At this point the sign bits are the same
      
        if (!this.unsigned) return this.sub(other).isNegative() ? -1 : 1; // Both are positive if at least one is unsigned
      
        return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
      };
    private gte(other) {
        return this.comp(
        /* validates */
        other) > 0;
      };
    private ge(other) {
        return this.gte(other);
    }
    //   LongPrototype.comp = LongPrototype.compare;
    // LongPrototype.gt = LongPrototype.greaterThan;
    private gt(other) {
        return this.comp(
        /* validates */
        other) > 0;
      };
    //   LongPrototype.mul = LongPrototype.multiply;


    // LongPrototype.lt = LongPrototype.lessThan;
    private lt(other) {
        return this.comp(
        /* validates */
        other) < 0;

      };
      private isOdd() {
        return (this.low & 1) === 1;
      };
    private mul(multiplier) {
        if (this.isZero()) return this;
        if (!isLong(multiplier)) multiplier = fromValue(multiplier); // use wasm support if present
      
        if (wasm) {
          var low = wasm["mul"](this.low, this.high, multiplier.low, multiplier.high);
          return fromBits(low, wasm["get_high"](), this.unsigned);
        }
      
        if (multiplier.isZero()) return this.unsigned ? UZERO : ZERO;
        if (this.eq(MIN_VALUE)) return multiplier.isOdd() ? MIN_VALUE : ZERO;
        if (multiplier.eq(MIN_VALUE)) return this.isOdd() ? MIN_VALUE : ZERO;
      
        if (this.isNegative()) {
          if (multiplier.isNegative()) return this.neg().mul(multiplier.neg());else return this.neg().mul(multiplier).neg();
        } else if (multiplier.isNegative()) return this.mul(multiplier.neg()).neg(); // If both longs are small, use float multiplication
      
      
        if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24)) return fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned); // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
        // We can skip products that would overflow.
      
        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;
        var b48 = multiplier.high >>> 16;
        var b32 = multiplier.high & 0xFFFF;
        var b16 = multiplier.low >>> 16;
        var b00 = multiplier.low & 0xFFFF;
        var c48 = 0,
            c32 = 0,
            c16 = 0,
            c00 = 0;
        c00 += a00 * b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 * b00;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c16 += a00 * b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 * b00;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c32 += a16 * b16;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c32 += a00 * b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
        c48 &= 0xFFFF;
        return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
      };
  
    private toNumber() {
        if (this.unsigned) return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
        return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
    };
}
let MIN_VALUE = fromBits(0, 0x80000000 | 0, false);
let MAX_VALUE = fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0, false);
let NEG_ONE = fromInt(-1);
let ONE = fromInt(1);
let UONE = fromInt(1, true);
let UZERO = fromInt(0, true);
let ZERO = fromInt(0);
let TWO_PWR_24_DBL = 1 << 24;
let MAX_UNSIGNED_VALUE = fromBits(0xFFFFFFFF | 0, 0xFFFFFFFF | 0, true);
let TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);

uint64.prototype['__isLong__'];
Object.defineProperty(uint64.prototype, "__isLong__", {
  value: true
});

function fromBits(lowBits, highBits, unsigned) {
    return new uint64(lowBits, highBits, unsigned);
}