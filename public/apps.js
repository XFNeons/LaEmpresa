// ============================
// GUARDAR CATÁLOGO
// ============================
document.getElementById('formCatalogo').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('cat-nombre').value;
    const descripcion = document.getElementById('cat-desc').value;

    try {
        const res = await fetch('/api/catalogs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, descripcion })
        });

        const data = await res.json();
        alert('Catálogo guardado correctamente');
    } catch (error) {
        console.error(error);
        alert('Error al guardar');
    }
});

// ============================
// GUARDAR DOCUMENTO
// ============================
async function guardarDocumentoCompleto() {
    const numero = document.getElementById('doc-numero').value;
    const fecha = document.getElementById('doc-fecha').value;
    const tipo = document.getElementById('doc-tipo').value;
    const entidad = document.getElementById('doc-entidad').value;
    const total = document.getElementById('doc-total').innerText.replace('$', '');

    try {
        const res = await fetch('/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numero, fecha, tipo, entidad, total })
        });

        const data = await res.json();
        alert('Documento guardado correctamente');
    } catch (error) {
        console.error(error);
        alert('Error al guardar documento');
    }
}
