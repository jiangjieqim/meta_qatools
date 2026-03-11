let TWO_PWR_16_DBL = 1 << 16;
let TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
let TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
let pow_dbl = Math.pow;
let INT_CACHE = {};
let wasm = null;
let UINT_CACHE = {};
function isLong(obj) {
    return (obj && obj["__isLong__"]) === true;
}
function fromString(str, unsigned = undefined, radix = undefined) {
    if (str.length === 0)
        throw Error('empty string');
    if (typeof unsigned === 'number') {
        radix = unsigned;
        unsigned = false;
    }
    else {
        unsigned = !!unsigned;
    }
    if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
        return unsigned ? UZERO : ZERO;
    radix = radix || 10;
    if (radix < 2 || 36 < radix)
        throw RangeError('radix');
    var p;
    if ((p = str.indexOf('-')) > 0)
        throw Error('interior hyphen');
    else if (p === 0) {
        return fromString(str.substring(1), unsigned, radix).neg();
    }
    var radixToPower = fromNumber(pow_dbl(radix, 8));
    var result = ZERO;
    for (var i = 0; i < str.length; i += 8) {
        var size = Math.min(8, str.length - i), value = parseInt(str.substring(i, i + size), radix);
        if (size < 8) {
            var power = fromNumber(pow_dbl(radix, size));
            result = result.mul(power).add(fromNumber(value));
        }
        else {
            result = result.mul(radixToPower);
            result = result.add(fromNumber(value));
        }
    }
    result.unsigned = unsigned;
    return result;
}
function fromValue(val, unsigned = false) {
    if (typeof val === 'number')
        return fromNumber(val, unsigned);
    if (typeof val === 'string')
        return fromString(val, unsigned);
    return fromBits(val.low, val.high, typeof unsigned === 'boolean' ? unsigned : val.unsigned);
}
function fromInt(value, unsigned = false) {
    var obj, cachedObj, cache;
    if (unsigned) {
        value >>>= 0;
        if (cache = 0 <= value && value < 256) {
            cachedObj = UINT_CACHE[value];
            if (cachedObj)
                return cachedObj;
        }
        obj = fromBits(value, 0, true);
        if (cache)
            UINT_CACHE[value] = obj;
        return obj;
    }
    else {
        value |= 0;
        if (cache = -128 <= value && value < 128) {
            cachedObj = INT_CACHE[value];
            if (cachedObj)
                return cachedObj;
        }
        obj = fromBits(value, value < 0 ? -1 : 0, false);
        if (cache)
            INT_CACHE[value] = obj;
        return obj;
    }
}
var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
function fromNumber(value, unsigned = false) {
    if (isNaN(value))
        return unsigned ? UZERO : ZERO;
    if (unsigned) {
        if (value < 0)
            return UZERO;
        if (value >= TWO_PWR_64_DBL)
            return MAX_UNSIGNED_VALUE;
    }
    else {
        if (value <= -TWO_PWR_63_DBL)
            return MIN_VALUE;
        if (value + 1 >= TWO_PWR_63_DBL)
            return MAX_VALUE;
    }
    if (value < 0)
        return fromNumber(-value, unsigned).neg();
    return fromBits(value % TWO_PWR_32_DBL | 0, value / TWO_PWR_32_DBL | 0, unsigned);
}
class uint64 {
    constructor(low = 0, high = 0, unsigned = true) {
        this.unsigned = true;
        this.low = low;
        this.high = high;
        this.unsigned = !!unsigned;
    }
    zero() {
        this.high = this.low = 0;
    }
    write(b) {
        b.writeUint32(this.high);
        b.writeUint32(this.low);
    }
    read(b) {
        this.high = b.readUint32();
        this.low = b.readUint32();
    }
    isZero() {
        return this.high === 0 && this.low === 0;
    }
    eq(other) {
        return this.equals(other);
    }
    equals(other) {
        if (!isLong(other))
            other = fromValue(other);
        if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1)
            return false;
        return this.high === other.high && this.low === other.low;
    }
    ;
    div(divisor) {
        return this.divide(divisor);
    }
    shiftRight(numBits) {
        if (isLong(numBits))
            numBits = numBits.toInt();
        if ((numBits &= 63) === 0)
            return this;
        else if (numBits < 32)
            return fromBits(this.low >>> numBits | this.high << 32 - numBits, this.high >> numBits, this.unsigned);
        else
            return fromBits(this.high >> numBits - 32, this.high >= 0 ? 0 : -1, this.unsigned);
    }
    shr(n) {
        return this.shiftRight(n);
    }
    add(addend) {
        if (!isLong(addend))
            addend = fromValue(addend);
        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;
        var b48 = addend.high >>> 16;
        var b32 = addend.high & 0xFFFF;
        var b16 = addend.low >>> 16;
        var b00 = addend.low & 0xFFFF;
        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
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
    }
    ;
    sub(subtrahend) {
        if (!isLong(subtrahend))
            subtrahend = fromValue(subtrahend);
        return this.add(subtrahend.neg());
    }
    ;
    not() {
        return fromBits(~this.low, ~this.high, this.unsigned);
    }
    ;
    neg() {
        if (!this.unsigned && this.eq(MIN_VALUE))
            return MIN_VALUE;
        return this.not().add(ONE);
    }
    ;
    shru(numBits) {
        if (isLong(numBits))
            numBits = numBits.toInt();
        if ((numBits &= 63) === 0)
            return this;
        if (numBits < 32)
            return fromBits(this.low >>> numBits | this.high << 32 - numBits, this.high >>> numBits, this.unsigned);
        if (numBits === 32)
            return fromBits(this.high, 0, this.unsigned);
        return fromBits(this.high >>> numBits - 32, 0, this.unsigned);
    }
    ;
    divide(divisor) {
        if (!isLong(divisor))
            divisor = fromValue(divisor);
        if (divisor.isZero())
            throw Error('division by zero');
        if (wasm) {
            if (!this.unsigned && this.high === -0x80000000 && divisor.low === -1 && divisor.high === -1) {
                return this;
            }
            var low = (this.unsigned ? wasm["div_u"] : wasm["div_s"])(this.low, this.high, divisor.low, divisor.high);
            return fromBits(low, wasm["get_high"](), this.unsigned);
        }
        if (this.isZero())
            return this.unsigned ? UZERO : ZERO;
        var approx, rem, res;
        if (!this.unsigned) {
            if (this.eq(MIN_VALUE)) {
                if (divisor.eq(ONE) || divisor.eq(NEG_ONE))
                    return MIN_VALUE;
                else if (divisor.eq(MIN_VALUE))
                    return ONE;
                else {
                    var halfThis = this.shr(1);
                    approx = halfThis.div(divisor).shl(1);
                    if (approx.eq(ZERO)) {
                        return divisor.isNegative() ? ONE : NEG_ONE;
                    }
                    else {
                        rem = this.sub(divisor.mul(approx));
                        res = approx.add(rem.div(divisor));
                        return res;
                    }
                }
            }
            else if (divisor.eq(MIN_VALUE))
                return this.unsigned ? UZERO : ZERO;
            if (this.isNegative()) {
                if (divisor.isNegative())
                    return this.neg().div(divisor.neg());
                return this.neg().div(divisor).neg();
            }
            else if (divisor.isNegative())
                return this.div(divisor.neg()).neg();
            res = ZERO;
        }
        else {
            if (!divisor.unsigned)
                divisor = divisor.toUnsigned();
            if (divisor.gt(this))
                return UZERO;
            if (divisor.gt(this.shru(1)))
                return UONE;
            res = UZERO;
        }
        rem = this;
        while (rem.gte(divisor)) {
            approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));
            var log2 = Math.ceil(Math.log(approx) / Math.LN2), delta = log2 <= 48 ? 1 : pow_dbl(2, log2 - 48), approxRes = fromNumber(approx), approxRem = approxRes.mul(divisor);
            while (approxRem.isNegative() || approxRem.gt(rem)) {
                approx -= delta;
                approxRes = fromNumber(approx, this.unsigned);
                approxRem = approxRes.mul(divisor);
            }
            if (approxRes.isZero())
                approxRes = ONE;
            res = res.add(approxRes);
            rem = rem.sub(approxRem);
        }
        return res;
    }
    ;
    toInt() {
        return this.unsigned ? this.low >>> 0 : this.low;
    }
    ;
    toString(radix = undefined) {
        radix = radix || 10;
        if (radix < 2 || 36 < radix)
            throw RangeError('radix');
        if (this.isZero())
            return '0';
        if (this.isNegative()) {
            if (this.eq(MIN_VALUE)) {
                var radixLong = fromNumber(radix), div = this.div(radixLong), rem1 = div.mul(radixLong).sub(this);
                return div.toString(radix) + rem1.toInt().toString(radix);
            }
            else
                return '-' + this.neg().toString(radix);
        }
        var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned), rem = this;
        var result = '';
        while (true) {
            var remDiv = rem.div(radixToPower), intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0, digits = intval.toString(radix);
            rem = remDiv;
            if (rem.isZero())
                return digits + result;
            else {
                while (digits.length < 6)
                    digits = '0' + digits;
                result = '' + digits + result;
            }
        }
    }
    isNegative() {
        return !this.unsigned && this.high < 0;
    }
    toUnsigned() {
        if (this.unsigned)
            return this;
        return fromBits(this.low, this.high, true);
    }
    ;
    comp(other) {
        if (!isLong(other))
            other = fromValue(other);
        if (this.eq(other))
            return 0;
        var thisNeg = this.isNegative(), otherNeg = other.isNegative();
        if (thisNeg && !otherNeg)
            return -1;
        if (!thisNeg && otherNeg)
            return 1;
        if (!this.unsigned)
            return this.sub(other).isNegative() ? -1 : 1;
        return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
    }
    ;
    gte(other) {
        return this.comp(other) > 0;
    }
    ;
    ge(other) {
        return this.gte(other);
    }
    gt(other) {
        return this.comp(other) > 0;
    }
    ;
    lt(other) {
        return this.comp(other) < 0;
    }
    ;
    isOdd() {
        return (this.low & 1) === 1;
    }
    ;
    mul(multiplier) {
        if (this.isZero())
            return this;
        if (!isLong(multiplier))
            multiplier = fromValue(multiplier);
        if (wasm) {
            var low = wasm["mul"](this.low, this.high, multiplier.low, multiplier.high);
            return fromBits(low, wasm["get_high"](), this.unsigned);
        }
        if (multiplier.isZero())
            return this.unsigned ? UZERO : ZERO;
        if (this.eq(MIN_VALUE))
            return multiplier.isOdd() ? MIN_VALUE : ZERO;
        if (multiplier.eq(MIN_VALUE))
            return this.isOdd() ? MIN_VALUE : ZERO;
        if (this.isNegative()) {
            if (multiplier.isNegative())
                return this.neg().mul(multiplier.neg());
            else
                return this.neg().mul(multiplier).neg();
        }
        else if (multiplier.isNegative())
            return this.mul(multiplier.neg()).neg();
        if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24))
            return fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned);
        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;
        var b48 = multiplier.high >>> 16;
        var b32 = multiplier.high & 0xFFFF;
        var b16 = multiplier.low >>> 16;
        var b00 = multiplier.low & 0xFFFF;
        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
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
    }
    ;
    toNumber() {
        if (this.unsigned)
            return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
        return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
    }
    ;
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
module.exports = {uint64,fromValue};
