const fs = require('fs');
const CleanCSS = require('clean-css');
const { minify } = require('terser');

async function run() {
  try {
    console.log("Minifying CSS...");
    const cssInput = fs.readFileSync('public/style.css', 'utf8');
    const cssMinified = new CleanCSS().minify(cssInput);
    if (cssMinified.errors.length > 0) {
      console.error("CleanCSS errors:", cssMinified.errors);
      process.exit(1);
    }
    fs.writeFileSync('public/style.min.css', cssMinified.styles);
    console.log("CSS minified successfully.");

    console.log("Minifying JS...");
    const jsInput = fs.readFileSync('public/app.js', 'utf8');
    const jsMinified = await minify(jsInput, {
      compress: true,
      mangle: true
    });
    fs.writeFileSync('public/app.min.js', jsMinified.code);
    console.log("JS minified successfully.");
  } catch (err) {
    console.error("Minification failed:", err);
    process.exit(1);
  }
}

run();
