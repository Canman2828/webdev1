window.onload = function() {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    const age = params.get('age');
    if (name && age) {
        document.getElementById('display').innerText = `Name: ${name}, Age: ${age}`;
    }
};