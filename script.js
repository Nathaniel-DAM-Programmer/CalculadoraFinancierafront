document.addEventListener('DOMContentLoaded', () => {
    const btnCalcular = document.getElementById('btn-calcular');
    const resultsContainer = document.getElementById('results-container');
    const resultsFinanciado = document.getElementById('results-financiado');
    const resultsContado = document.getElementById('results-contado');
    const form = document.getElementById('calculator-form');
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080' 
    : 'https://tu-calculadora-api.onrender.com';

    // Renderiza cada resultado y aplica color según su posición
    function renderResults(container, data, esConSeguro) {
        container.innerHTML = ''; 
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="result-item" style="color: #888;">No hay opciones disponibles en la BD</div>';
            return;
        }

        const totalItems = data.length;

        data.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'result-item';

            // Calcula el tono HSL para el color de la fila
            let hue = totalItems === 1 ? 120 : 120 - (index * (120 / (totalItems - 1)));

            // Selecciona cuota y código según si hay garantía activa
            const cuota = esConSeguro ? item.cuotaConSeguro : item.cuotaSinSeguro;
            const codigoFinanciera = esConSeguro ? item.codigoConSeguro : item.codigoSinSeguro;

            // Badge extra para BBVA cuando aplica
            let badgeHtml = '';
            if (item.nombreFinanciera && item.nombreFinanciera.toUpperCase() === 'BBVA') {
                badgeHtml = `<span class="badge-orange">TIN Aplicado: ${item.tinAplicado}%</span>`;
            }

            row.innerHTML = `
                <div class="col-code" title="Código: ${codigoFinanciera}">
                    <div class="circle-code" style="background-color: hsl(${hue}, 75%, 41%); font-size: 11px;">
                        ${codigoFinanciera || 'S/C'}
                    </div>
                </div>
                <div class="col-bank bank-info">
                    <span class="bank-name">${item.nombreFinanciera}</span>
                    ${badgeHtml}
                </div>
                <div class="col-amount amount-val">
                    ${cuota ? parseFloat(cuota).toFixed(2) : '0.00'} €
                </div>
            `;
            container.appendChild(row);
        });
    }

    btnCalcular.addEventListener('click', () => {
        // Recoge valores del formulario
        const formData = new FormData(form);
        
        const checkboxGarantia = document.getElementById('sin-garantia');
        // Convierte el checkbox en bandera de garantía activa
        const conGarantia = checkboxGarantia ? !checkboxGarantia.checked : true; 

        const payload = {
            fechaMatriculacion: formData.get('fechaMatriculacion'),
            precioFinanciado: parseFloat(formData.get('precioFinanciado')) || 0,
            tinFinanciado: parseFloat(formData.get('tinFinanciado')) || 0,
            plazoFinanciado: parseInt(formData.get('plazoFinanciado')) || 0,
            precioContado: parseFloat(formData.get('precioContado')) || 0,
            tinContado: parseFloat(formData.get('tinContado')) || 0,
            conGarantia: conGarantia
        };

        // Validación preliminar del formulario
        if (payload.precioFinanciado <= 0 || payload.precioContado <= 0) {
            alert("Por favor, introduce precios válidos mayores que 0 en ambas columnas.");
            return;
        }

        // Envía los datos al backend
       fetch(`${API_BASE_URL}/api/financiera/calcular`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
    body: JSON.stringify(payload)
})
        .then(response => {
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            return response.json();
        })
        .then(data => {
            // Muestra los resultados recibidos del servidor
            renderResults(resultsFinanciado, data.opcionesFinanciado, conGarantia);
            renderResults(resultsContado, data.opcionesContado, conGarantia);

            // Despliega resultados y hace scroll suave hasta ellos
            resultsContainer.classList.remove('hidden');
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        })
        .catch(error => {
            console.error('Error de conexión:', error);
            alert('No se pudo establecer comunicación con el servidor Java (localhost:8080). Comprueba que esté encendido.');
        });
    });
});