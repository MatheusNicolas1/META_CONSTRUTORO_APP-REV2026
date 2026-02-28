const fs = require('fs');
try {
    const lockContent = fs.readFileSync('package-lock.json', 'utf8');
    const lock = JSON.parse(lockContent);
    const pkg = {
        name: lock.name || "vite-project",
        version: lock.version || "0.0.0",
        private: true,
        type: "module",
        scripts: {
            "dev": "vite",
            "build": "tsc -b && vite build",
            "lint": "eslint .",
            "preview": "vite preview"
        },
        dependencies: lock.packages[''] ? lock.packages[''].dependencies : {},
        devDependencies: lock.packages[''] ? lock.packages[''].devDependencies : {}
    };
    console.log(JSON.stringify(pkg, null, 2));
} catch (e) {
    console.error("Error reading/parsing package-lock.json:", e);
}
