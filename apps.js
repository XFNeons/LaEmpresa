// --- VARIABLES DE ESTADO ---
let movimientosActuales = [];
let tipoDocumentoActual = "";

// --- NAVEGACIÓN ---
function navegar(id) {
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
    
    // Si existe la sección del formulario azul especial, también la ocultamos por defecto
    const formEspecial = document.getElementById('form-conceptos-especial');
    if (formEspecial) formEspecial.style.display = 'none';

    // Mostrar la sección deseada
    const vista = document.getElementById('vista-' + id);
    if (vista) vista.classList.add('activa');
}

// --- LÓGICA DE CATÁLOGOS (Productos, Proveedores, etc.) ---
function abrirCatalogo(nombre) {
    document.getElementById('titulo-catalogo').innerText = "Catálogo de " + nombre;
    document.getElementById('formCatalogo').reset();
    // Guardamos qué tabla estamos editando en un atributo del form para el fetch
    document.getElementById('formCatalogo').dataset.tabla = nombre.toLowerCase(); 
    navegar('catalogos');
}

// Evento para GUARDAR en Catálogos (Fetch al Servidor)
document.getElementById('formCatalogo').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const tabla = this.dataset.tabla; // 'productos' o 'proveedores'
    const datos = {
        nombre: document.getElementById('cat-nombre').value,
        descripcion: document.getElementById('cat-desc').value
    };

    fetch(`http://localhost:3000/api/catalogos/${tabla}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
    .then(res => res.json())
    .then(data => {
        alert("✅ Guardado en catálogo: " + data.mensaje);
        navegar('inicio');
    })
    .catch(err => alert("❌ Error al conectar con el servidor"));
});

// --- LÓGICA DE DOCUMENTOS (Entradas / Salidas) ---
function abrirDocumento(tipo) {
    tipoDocumentoActual = tipo;
    movimientosActuales = []; // Reiniciar lista
    document.getElementById('titulo-doc').innerText = "Documento de " + tipo;
    document.getElementById('doc-tipo').value = tipo;
    document.getElementById('lbl-entidad').innerText = (tipo === 'Entrada') ? "Proveedor" : "Destino";
    
    actualizarTabla();
    navegar('documentos');
}

// Cálculos automáticos dentro del Modal
const inPre = document.getElementById('m-precio');
const inCan = document.getElementById('m-cant');
const inSub = document.getElementById('m-sub');

[inPre, inCan].forEach(input => {
    input.addEventListener('input', () => {
        const res = (parseFloat(inPre.value) || 0) * (parseFloat(inCan.value) || 0);
        inSub.value = "$" + res.toFixed(2);
    });
});

// Función para agregar el producto a la lista temporal
function agregarMovimiento() {
    const p = document.getElementById('m-prod').value;
    const pre = parseFloat(inPre.value) || 0;
    const can = parseFloat(inCan.value) || 0;

    if(p && can > 0) {
        movimientosActuales.push({ 
            no: movimientosActuales.length + 1, 
            producto: p, 
            precio: pre, 
            cantidad: can, 
            subtotal: pre * can 
        });
        actualizarTabla();
        
        // Cerrar modal de Bootstrap
        const modalElement = document.getElementById('modalProd');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();

        // Limpiar campos del modal
        document.getElementById('m-prod').value = ""; 
        inPre.value = ""; inCan.value = ""; inSub.value = "";
    } else {
        alert("Por favor rellena el nombre y la cantidad.");
    }
}

// Dibujar la tabla en el HTML
function actualizarTabla() {
    const cuerpo = document.getElementById('tabla-movimientos');
    cuerpo.innerHTML = "";
    let total = 0;

    movimientosActuales.forEach(m => {
        total += m.subtotal;
        cuerpo.innerHTML += `
            <tr>
                <td>${m.no}</td>
                <td>${m.producto}</td>
                <td>${m.cantidad}</td>
                <td>$${m.precio.toFixed(2)}</td>
                <td>$${m.subtotal.toFixed(2)}</td>
            </tr>`;
    });
    document.getElementById('doc-total').innerText = `$${total.toFixed(2)}`;
}

// ENVIAR TODO EL DOCUMENTO AL SERVIDOR
function guardarDocumentoCompleto() {
    const dataFinal = {
        numero: document.getElementById('doc-numero').value,
        fecha: document.getElementById('doc-fecha').value,
        tipo: tipoDocumentoActual,
        entidad: document.getElementById('doc-entidad').value,
        concepto: 1, // Valor por defecto
        movimientos: movimientosActuales,
        total: parseFloat(document.getElementById('doc-total').innerText.replace('$', ''))
    };

    if (!dataFinal.numero || movimientosActuales.length === 0) {
        alert("Faltan datos o productos por agregar.");
        return;
    }

    fetch('http://localhost:3000/api/guardar-documento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataFinal)
    })
    .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
    })
    .then(data => {
        alert("✅ " + data.mensaje);
        movimientosActuales = [];
        actualizarTabla();
        navegar('inicio');
    })
    .catch(err => alert("❌ Error: Asegúrate que el servidor esté encendido."));
}