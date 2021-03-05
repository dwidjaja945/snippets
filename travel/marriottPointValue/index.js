function getNumber(string) {
    if (!string) return null;
    let output = '';
    for (let i = 0; i < string.length; i++) {
        if (!Number.isNaN(Number(string[i]))) {
            output += string[i];
        }
    };
    return Number(output);
};

function getMarriottPointValue() {
    const list = document.querySelector('.js-property-list-container').children;

    const table = {};
    [...list].forEach(node => {
        const name = node.querySelector('.js-hotel-name').innerText;
        let points = node.querySelector('.t-points')?.innerText;
        points = getNumber(points);
        let dollars = node.querySelector('.t-price')?.innerText;
        dollars = getNumber(dollars);
        if (points == null || dollars == null) return;
        const centsPerPoint = (dollars / points).toPrecision(3);
        if (centsPerPoint < Infinity) {
            table[name] = centsPerPoint;
        };
    });

    const hotelNames = Object.keys(table);
    const sorted = hotelNames.sort((a,b) => table[b] - table[a]);
    const output = sorted.map(name => [name, `$${table[name]}`]);
    console.log(output);
    return output;
};

getMarriottPointValue();
