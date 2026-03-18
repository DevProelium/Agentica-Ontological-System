const fs = require('fs');
function generateShadows(count) {
  let shadows = [];
  for(let i=0; i<count; i++) {
    shadows.push(`${Math.floor(Math.random() * 2000)}px ${Math.floor(Math.random() * 2000)}px #FFF`);
  }
  return shadows.join(', ');
}

const css = `
/* STARFIELD BACKGROUND STYLES */
#stars {
  width: 1px;
  height: 1px;
  background: transparent;
  box-shadow: ${generateShadows(700)};
  animation: animStar 50s linear infinite;
  position: absolute;
  top: 0;
  left: 0;
}
#stars:after {
  content: ' ';
  position: absolute;
  top: 2000px;
  width: 1px;
  height: 1px;
  background: transparent;
  box-shadow: ${generateShadows(700)};
}
#stars2 {
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: ${generateShadows(200)};
  animation: animStar 100s linear infinite;
  position: absolute;
  top: 0;
  left: 0;
}
#stars2:after {
  content: ' ';
  position: absolute;
  top: 2000px;
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: ${generateShadows(200)};
}
#stars3 {
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow: ${generateShadows(100)};
  animation: animStar 150s linear infinite;
  position: absolute;
  top: 0;
  left: 0;
}
#stars3:after {
  content: ' ';
  position: absolute;
  top: 2000px;
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow: ${generateShadows(100)};
}

@keyframes animStar {
  from {
    transform: translateY(0px);
  }
  to {
    transform: translateY(-2000px);
  }
}
`;

let existingCss = fs.readFileSync('packages/frontend/src/App.css', 'utf8');
if(!existingCss.includes('STARFIELD')) {
  fs.writeFileSync('packages/frontend/src/App.css', existingCss + '\n' + css);
}
console.log('CSS injection done.');