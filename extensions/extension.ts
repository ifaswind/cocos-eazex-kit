String.prototype.translate = function () {
    // TODO
    return this;
};

String.prototype.clamp = function (start, threshold, suffix = '...') {
    if (this.replace(/[^\x00-\xff]/g, 'xx').length <= threshold) return this;
    let charCount = 0;
    let result = '';
    for (let i = start; i < this.length; i++) {
        charCount += /[^\x00-\xff]/.test(this[i]) ? 2 : 1;
        if (charCount > threshold) return result += suffix;
        result += this[i];
    }
    return result;
};

Array.prototype.include = function (item: any): boolean {
    for (let i = 0; i < this.length; i++) {
        if (this[i] === item) return true;
    }
    return false;
};