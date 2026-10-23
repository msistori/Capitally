const fs = require('node:fs/promises');
const path = require('node:path');
const { instance } = require('@viz-js/viz');
const sharp = require('sharp');

const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

async function main() {
  const sql = await fs.readFile(path.join(__dirname, '../../database/schema_capitally.sql'), 'utf8');
  const tables = [];
  const relations = [];

  for (const match of sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\n\);/g)) {
    const [, name, body] = match;
    const columns = [];
    for (const line of body.split('\n')) {
      const column = line.match(/^\s+(\w+)\s+(BIGINT|UUID|BOOLEAN|DATE|TIMESTAMP(?: WITH TIME ZONE)?|VARCHAR\(\d+\)|NUMERIC\(\d+,\s*\d+\))(.*)/);
      if (!column) continue;
      const [, field, type, constraints] = column;
      columns.push({ field, type, primary: constraints.includes('PRIMARY KEY'),
        required: /NOT NULL|PRIMARY KEY/.test(constraints),
        unique: new RegExp(`UNIQUE \\(\s*${field}\\s*\\)`).test(body) });
      const reference = constraints.match(/REFERENCES (\w+)\((\w+)\)/);
      if (reference) relations.push({ child: name, field, parent: reference[1], target: reference[2] });
    }
    for (const reference of body.matchAll(/FOREIGN KEY \((\w+)\) REFERENCES (\w+)\((\w+)\)/g)) {
      relations.push({ child: name, field: reference[1], parent: reference[2], target: reference[3] });
    }
    tables.push({ name, columns });
  }

  const lines = [
    'digraph Capitally {',
    'graph [rankdir=LR, bgcolor="white", pad=0.5, nodesep=0.55, ranksep=1.25, splines=spline, fontname="Arial", fontsize=22, labelloc=t, label="Capitally — Current database schema"];',
    'node [shape=plain, fontname="Arial", fontsize=12];',
    'edge [color="#64748b", fontname="Arial", fontsize=10, fontcolor="#334155", arrowsize=0.7, dir=none, labeldistance=2.3];'
  ];

  for (const table of tables) {
    const rows = table.columns.map(column => {
      const foreign = relations.some(relation => relation.child === table.name && relation.field === column.field);
      const keys = [column.primary && 'PK', foreign && 'FK', column.unique && 'UK', column.required && 'NN'].filter(Boolean).join(' ');
      return `<TR><TD ALIGN="LEFT" PORT="${column.field}">${column.field}</TD><TD ALIGN="LEFT">${escapeHtml(column.type)}</TD><TD ALIGN="LEFT" PORT="${column.field}_key">${keys}</TD></TR>`;
    });
    lines.push(`${table.name} [label=<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="7" COLOR="#cbd5e1"><TR><TD COLSPAN="3" BGCOLOR="#005f73"><FONT COLOR="white"><B>${table.name}</B></FONT></TD></TR><TR><TD BGCOLOR="#e6f2f4"><B>Column</B></TD><TD BGCOLOR="#e6f2f4"><B>SQL type</B></TD><TD BGCOLOR="#e6f2f4"><B>Keys</B></TD></TR>${rows.join('')}</TABLE>>];`);
  }

  for (const relation of relations) {
    const child = tables.find(table => table.name === relation.child);
    const column = child.columns.find(item => item.field === relation.field);
    lines.push(`${relation.parent}:${relation.target}_key:e -> ${relation.child}:${relation.field}:w [label="${column.required ? '1' : '0..1'} : 0..N"];`);
  }

  lines.push('legend [label=<<TABLE BORDER="0" CELLBORDER="0" CELLPADDING="4"><TR><TD ALIGN="LEFT"><B>Legend</B></TD></TR><TR><TD ALIGN="LEFT">PK: primary key · FK: foreign key · UK: unique · NN: not null</TD></TR><TR><TD ALIGN="LEFT">1: exactly one · 0..1: optional · 0..N: zero or more</TD></TR><TR><TD ALIGN="LEFT">Relationship labels: parent cardinality : child cardinality</TD></TR><TR><TD ALIGN="LEFT">Lines connect referenced keys to foreign-key columns.</TD></TR><TR><TD ALIGN="LEFT">Source: database/schema_capitally.sql · Current tables only</TD></TR></TABLE>>];');
  lines.push('}');

  const dot = lines.join('\n') + '\n';
  const viz = await instance();
  const svg = viz.renderString(dot, { format: 'svg', engine: 'dot' });
  const output = path.join(__dirname, 'ER_Diagram_Capitally');
  await fs.writeFile(output + '.dot', dot);
  await fs.writeFile(output + '.svg', svg);
  await sharp(Buffer.from(svg), { density: 144 }).png().toFile(output + '.png');
  console.log(`Generated ${tables.length} tables and ${relations.length} foreign-key relationships.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
