DiveTools.mixFill = function(supplyPressure, supplySize, receivePressure, receiveSize, receiveAddPressure) {
    if (!Number.isFinite(supplyPressure) || !Number.isFinite(supplySize) ||
        !Number.isFinite(receivePressure) || !Number.isFinite(receiveSize) ||
        !Number.isFinite(receiveAddPressure) || supplySize <= 0 || receiveSize <= 0 ||
        receiveAddPressure < 0) {
        return { valid: false, supplyResult: 0, receiveResult: 0, warning: false };
    }
    const receiveResult = receivePressure + receiveAddPressure;
    const supplyResult = ((supplyPressure * supplySize) - (receiveAddPressure * receiveSize)) / supplySize;
    return {
        valid: Number.isFinite(supplyResult) && Number.isFinite(receiveResult),
        supplyResult,
        receiveResult,
        warning: supplyResult < receiveResult
    };
};
DiveTools.mixFillEqualize = function(supplyPressure, supplySize, receivePressure, receiveSize) {
    if (!Number.isFinite(supplyPressure) || !Number.isFinite(supplySize) ||
        !Number.isFinite(receivePressure) || !Number.isFinite(receiveSize) ||
        supplySize <= 0 || receiveSize <= 0) {
        return 0;
    }
    return ((supplyPressure * supplySize) + (receivePressure * receiveSize)) / (supplySize + receiveSize);
};
