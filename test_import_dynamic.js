async function test() {
    try {
        await import('./src/app.js');
        console.log("Success");
    } catch (e) {
        console.error(e);
    }
}
test();
