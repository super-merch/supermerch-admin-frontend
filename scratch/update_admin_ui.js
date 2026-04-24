const fs = require('fs');
const path = 'src/pages/Master/CustomizationMethod.js';
let content = fs.readFileSync(path, 'utf8');

// Update columns
content = content.replace(
    /(\s+)name: "Application Method",/g,
    '$1name: "Display Name",\n$1selector: (row) => <p className="text-wrap">{row.displayName || row.applicationMethod}</p>,\n$1sortable: true,\n$1},\n$1{\n$1name: "Application Method",'
);

// Update renderForm
const formInsert = `                    <Col lg={4}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="displayName"
                          value={values.displayName}
                          onChange={handleChange}
                          placeholder="Enter Display Name"
                        />
                        <label className="form-label">Display Name</label>
                      </div>
                    </Col>
                    <Col lg={8}>
                      <div className="form-floating mb-3">
                        <textarea
                          className="form-control"
                          style={{ height: '100px' }}
                          name="description"
                          value={values.description}
                          onChange={handleChange}
                          placeholder="Enter Description"
                        />
                        <label className="form-label">Description</label>
                      </div>
                    </Col>\n`;

content = content.replace(
    /(\s+)<Col lg=\{4\}>\s+<div className=\"form-floating mb-3\">\s+<select/g,
    (match) => formInsert + match
);

fs.writeFileSync(path, content);
console.log("Successfully updated CustomizationMethod.js");
