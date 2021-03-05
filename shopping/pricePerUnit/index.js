var OZ = 'oz';
var OUNCE = 'ounce';
var LB = 'lb';
var POUND = 'pound';
var CT = 'ct';
var FL_OZ = 'floz';
var GAL = 'gal';

var PK = 'PK';

// units
// (oz)|(lb)|(ct)|(ounce)|(gal)|(fl ?oz)
var UNIT_REGEX = / ?(oz)|(lb)|(ct)|(ounce)|(gal)|(fl ?oz)/gi;
var QUANTITY_REGEX = ' ?(pk)';

var AMAZON_SELECTOR = '[data-component-type="s-search-result"]';
var TARGET_SELECTOR = '[data-test="productCardBody"]';
var SHIPT_SELECTOR = '[data-test="ProductCard"]';
var INSTACART_SELECTOR = "[data-radium='true'].item-card";
var SAY_WEEE_SELECTOR = '.product-media';

var domain = document.location.hostname;
var selector = (() => {
  switch (domain.toLowerCase()) {
    case 'www.target.com':
      return TARGET_SELECTOR;
    case 'www.amazon.com':
      return AMAZON_SELECTOR;
    case 'shop.shipt.com':
      return SHIPT_SELECTOR;
    case 'www.instacart.com':
    case 'sameday.costco.com':
      return INSTACART_SELECTOR;
    case 'www.sayweee.com':
      return SAY_WEEE_SELECTOR;
    default:
      throw new Error(`Unhandled domain: ${domain}`);
  };
})();

var getUnit = unit => {
  switch (unit) {
    case OZ:
    case OUNCE:
      return OZ;
    case LB:
    case POUND:
      return LB;
    default:
      return unit;
      //             throw new Error(`Unhandled unit: ${unit}`);
      break;
  };
};

var checkForOz = units => Object.keys(units).some(unit => unit === OZ);
var checkForFlOz = units => Object.keys(units).some(unit => unit === FL_OZ);

var convertUnits = (unitGroups, from, to, conversionFactor) => {
  const array = unitGroups[from];
  if (unitGroups[to] === undefined) unitGroups[to] = [];
  array.forEach(oz => {
    oz.price = oz.price * conversionFactor;
    oz.unit = to;
    unitGroups[to].push(oz);
  })
  delete unitGroups[from];
};

var handleConversions = unitGroups => {
  var hasOz = checkForOz(unitGroups);
  var hasFlOz = checkForFlOz(unitGroups);
  if (hasOz) {
    if (confirm('convert oz to lb?')) {
      convertUnits(unitGroups, OZ, LB, 16);
    };
  }
  if (hasFlOz) {
    if (confirm('Conver fl oz to gallons?')) {
      convertUnits(unitGroups, FL_OZ, GAL, 128);
    }
  }
};

var runSearch = () => {
  var cards = document.querySelectorAll(selector);
  var quantifierRegex = new RegExp(`[0-9.]+${QUANTITY_REGEX}`, 'i');

  var table = {};
  cards.forEach(card => {
    const { innerText: text } = card;

    const linkEl = card.querySelector('a');

    // x[unit]
    const match = text.match(/[0-9.]+ ?((oz)|(lb)|(ct)|(ounce)|(gal)|(fl oz))/gi);
    // xx.xx
    const textMatch = text.match(/\$[0-9]+[.]?[0-9]{2}/m);
    if (!match || !textMatch) return;
    const { 0: _amount, index: amountIdx } = match;
    // x[quantifier]
    const quantifierMatch = text.match(quantifierRegex);
    let quantity = 1;
    let quantityUnit = 'unit';
    if (quantifierMatch) {
      const [amount, _quantityUnit] = quantifierMatch;
      quantity = Number(amount.replace(_quantityUnit, ''));
      quantityUnit = _quantityUnit;
    };
    // [unit]
    let [unit] = _amount.match(UNIT_REGEX);
    unit = unit.replace(' ', '').toLowerCase();
    // xx.xx
    const amount = Number(_amount.replace(UNIT_REGEX, ''));

    const [_price] = textMatch;
    const price = Number(_price.replace('$', ''));
    const pricePerUnit = (price / (amount * quantity)).toFixed(3);
    const originalName = text.slice(0, amountIdx);
    let name = originalName;
    const nameMatch = name.match(/ - /);
    if (nameMatch) {
      const { index: seperatorIdx } = nameMatch
      name = name.slice(0, seperatorIdx);
    };

    const product = `${name} ${quantity + quantityUnit}/${amount + unit}`;
    const tableData = { price: pricePerUnit, unit, link: linkEl, product };
    if (table[name] === undefined) {
      table[name] = tableData;
    } else {
      table[originalName] = tableData;
    }
  });

  var unitGroups = {};
  Object.keys(table).forEach(name => {
    const { price, unit: _unit, link, product } = table[name];
    let unit = getUnit(_unit);
    if (unitGroups[unit] === undefined) {
      unitGroups[unit] = [];
    };
    unitGroups[unit].push({ name: product, price, unit, link });
  });

  handleConversions(unitGroups);

  Object.keys(unitGroups).forEach(group => {
    const array = unitGroups[group];
    unitGroups[group] = array.sort((a, b) => a.price - b.price);
    unitGroups[group] = unitGroups[group].map(group => {
      const pricePerUnit = `$${group.price} per ${group.unit}`;
      const output = [pricePerUnit, group.name];
      output['link'] = group.link;
      return output;
    });
  });
  return unitGroups;
};


// ==== Modal Logic Start ====
var applyStyles = (node, styles) => {
  for (style in styles) {
    node.style[style] = styles[style];
  };
};

var removeModal = () => {
  const oldModal = document.querySelector('#search_results_id');
  if (oldModal) { document.body.removeChild(oldModal) };
};

function renderModal(searchResults) {
  removeModal();
  const modal = document.createElement('div');
  modal.id = 'search_results_id';
  applyStyles(modal, {
    position: 'fixed',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    zIndex: 10000,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  });
  const modalContent = document.createElement('div');
  applyStyles(modalContent, {
    top: '10px',
    right: '10px',
    height: '70%',
    width: '35%',
    minWidth: '500px',
    backgroundColor: 'white',
    borderRadius: '6px',
    margin: '20px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 0 17px 3px rgba(0, 0, 0, 0.25)'
  });
  const modalHeader = document.createElement('header');
  applyStyles(modalHeader, {
    padding: '10px 15px',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#eee',
  });
  const headerContent = document.createElement('button');
  headerContent.innerText = 'X';
  headerContent.onclick = () => {
    document.body.removeChild(modal);
  };
  modalHeader.appendChild(headerContent);
  const modalBody = document.createElement('div');
  applyStyles(modalBody, {
    padding: '10px',
    overflow: 'scroll',
  })
  const units = Object.keys(searchResults);
  units.forEach(unit => {
    const unitList = document.createElement('ul');
    const list = searchResults[unit];
    list.forEach(result => {
      const listItem = document.createElement('li');
      applyStyles(listItem, {
        padding: '5px',
        borderBottom: '1px solid #eee',
        marginBottom: '5px',
        cursor: 'pointer',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      });
      listItem.onclick = () => {
        removeModal();
        result.link.click();
      };
      listItem.innerHTML = `<b>${result[0]}</b>: ${result[1]}`;
      unitList.appendChild(listItem);
    });
    const label = document.createElement('h4');
    label.innerText = `Unit: ${unit}`;
    append(label).to(modalBody);
    modalBody.appendChild(unitList);
  });

  append(document.body)
    .add(modal);
  append(modal)
    .add(modalContent);
  append(modalContent)
    .add(modalHeader, modalBody);
};

function append(...nodes) {
  const output = {
    to: targetNode => {
      nodes.forEach(node => {
        targetNode.appendChild(node);
      });
      return output;
    },
    add: (...childNodes) => {
      if (nodes.length > 1) {
        throw new Error(`You can not add to multiple nodes`);
      };
      childNodes.forEach(childNode => {
        nodes[0].appendChild(childNode);
      });
      return output;
    }
  }
  return output;
};
// ==== Modal Logic End ====

// actual work is run here
function main() {
  const limit = 10;
  let i = 0;
  const interval = setInterval(() => {
    if (i === limit) {
      clearInterval(interval);
      setTimeout(() => {
        window.scrollTo(0, 0);
        const searchResults = runSearch();
        if (Object.keys(searchResults).length) {
          console.log("Price per unit. Lower is better. \n", searchResults);
          renderModal(searchResults);
          return;
        };
        console.log('No results');
      }, 0);
    };
    i++;
    window.scrollBy(0, document.body.scrollHeight);
  }, 100);
};

main();
