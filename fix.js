const fs = require('fs');

const pathGraphView = 'packages/frontend/src/components/GraphView/GraphView.jsx';
let contentGraph = fs.readFileSync(pathGraphView, 'utf8');
contentGraph = contentGraph.replace(/<g key=\{el--\\[}\\]>/g, '<g key={`el-${i}`}>\n');
// Also: <g key={el--\}>
contentGraph = contentGraph.replace("<g key={el--\\}>", "<g key={`el-${i}`}>\n");

contentGraph = contentGraph.replace("<g key={nodo.id} transform={    ranslate(, )}>", "<g key={nodo.id} transform={`translate(${pos.x}, ${pos.y})`}>\n");
fs.writeFileSync(pathGraphView, contentGraph);

const pathWizard = 'packages/frontend/src/components/WizardFlow/WizardFlow.jsx';
let contentWizard = fs.readFileSync(pathWizard, 'utf8');

// replace all \${ with ${
contentWizard = contentWizard.replaceAll("\\${", "${");

fs.writeFileSync(pathWizard, contentWizard);

console.log('Fixed files');
