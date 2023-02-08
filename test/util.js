function ms(ms = 10) { // wait a little to stabilize tests
    return new Promise((res, rej) => {
        setTimeout(() => res(), ms);
    });
}

function traverse(el, fn) {
    fn(el);
    for (const child of el.childNodes) {
        traverse(child, fn);
    }
}

function isAncestor(ancestor, el) {
    while ((el = el.parentNode)) {
        if (ancestor === el) {
            return true;
        }
    }
    return false;
}

function getDate(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${("0" + (d.getMonth() + 1)).slice(-2)}-${("0" + d.getDate()).slice(-2)}`;
}

module.exports = {
    ms,
    traverse,
    isAncestor,
    getDate,
}