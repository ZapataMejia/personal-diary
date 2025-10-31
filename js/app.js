// Aplicación de Diario Personal
class DiaryApp {
    constructor() {
        this.entries = this.loadEntries();
        this.editingId = null;
        this.init();
    }

    init() {
        // Establecer fecha de hoy por defecto
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('entryDate').value = today;

        // Event listeners
        document.getElementById('diaryForm').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('cancelBtn').addEventListener('click', () => this.cancelEdit());
        document.getElementById('searchInput').addEventListener('input', (e) => this.filterEntries(e.target.value));
        document.getElementById('confirmDelete').addEventListener('click', () => this.confirmDelete());
        document.getElementById('cancelDelete').addEventListener('click', () => this.closeDeleteModal());

        // Renderizar entradas iniciales
        this.renderEntries();
    }

    // Cargar entradas desde localStorage
    loadEntries() {
        const stored = localStorage.getItem('diaryEntries');
        return stored ? JSON.parse(stored) : [];
    }

    // Guardar entradas en localStorage
    saveEntries() {
        localStorage.setItem('diaryEntries', JSON.stringify(this.entries));
    }

    // Manejar envío del formulario
    handleSubmit(e) {
        e.preventDefault();

        const title = document.getElementById('entryTitle').value.trim();
        const date = document.getElementById('entryDate').value;
        const content = document.getElementById('entryContent').value.trim();

        if (!title || !content) {
            alert('Por favor, completa todos los campos');
            return;
        }

        if (this.editingId !== null) {
            // Editar entrada existente
            const index = this.entries.findIndex(entry => entry.id === this.editingId);
            if (index !== -1) {
                this.entries[index] = {
                    ...this.entries[index],
                    title,
                    date,
                    content,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            // Crear nueva entrada
            const newEntry = {
                id: Date.now().toString(),
                title,
                date,
                content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.entries.unshift(newEntry);
        }

        this.saveEntries();
        this.resetForm();
        this.renderEntries();
    }

    // Resetear formulario
    resetForm() {
        document.getElementById('diaryForm').reset();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('entryDate').value = today;
        document.getElementById('formTitle').textContent = 'Nueva Entrada';
        document.getElementById('saveBtn').textContent = '💾 Guardar';
        document.getElementById('cancelBtn').style.display = 'none';
        this.editingId = null;
    }

    // Renderizar todas las entradas
    renderEntries(filteredEntries = null) {
        const entriesList = document.getElementById('entriesList');
        const emptyState = document.getElementById('emptyState');
        const entries = filteredEntries || this.entries;

        entriesList.innerHTML = '';

        if (entries.length === 0) {
            emptyState.classList.add('show');
            return;
        }

        emptyState.classList.remove('show');

        entries.forEach(entry => {
            const entryCard = this.createEntryCard(entry);
            entriesList.appendChild(entryCard);
        });
    }

    // Crear tarjeta de entrada
    createEntryCard(entry) {
        const card = document.createElement('div');
        card.className = 'entry-card';
        card.dataset.id = entry.id;

        const formattedDate = this.formatDate(entry.date);
        const preview = entry.content.length > 150 
            ? entry.content.substring(0, 150) + '...' 
            : entry.content;

        card.innerHTML = `
            <div class="entry-header">
                <div>
                    <div class="entry-title">${this.escapeHtml(entry.title)}</div>
                    <div class="entry-date">${formattedDate}</div>
                </div>
            </div>
            <div class="entry-content">${this.escapeHtml(preview)}</div>
            <div class="entry-actions">
                <button class="btn btn-success" onclick="diaryApp.editEntry('${entry.id}')">
                    ✏️ Editar
                </button>
                <button class="btn btn-danger" onclick="diaryApp.showDeleteModal('${entry.id}')">
                    🗑️ Eliminar
                </button>
            </div>
        `;

        // Click en la tarjeta para ver contenido completo
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                this.viewFullEntry(entry);
            }
        });

        return card;
    }

    // Formatear fecha
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    // Escape HTML para prevenir XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Editar entrada
    editEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;

        this.editingId = id;
        document.getElementById('entryTitle').value = entry.title;
        document.getElementById('entryDate').value = entry.date;
        document.getElementById('entryContent').value = entry.content;
        document.getElementById('formTitle').textContent = 'Editar Entrada';
        document.getElementById('saveBtn').textContent = '💾 Guardar Cambios';
        document.getElementById('cancelBtn').style.display = 'inline-flex';

        // Scroll al formulario
        document.querySelector('.entry-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Cancelar edición
    cancelEdit() {
        this.resetForm();
    }

    // Ver entrada completa
    viewFullEntry(entry) {
        const formattedDate = this.formatDate(entry.date);
        const content = this.escapeHtml(entry.content);

        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <h2>${this.escapeHtml(entry.title)}</h2>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${formattedDate}</p>
                <div style="line-height: 1.8; margin-bottom: 25px; white-space: pre-wrap;">${content}</div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cerrar</button>
                    <button class="btn btn-success" onclick="diaryApp.editEntry('${entry.id}'); this.closest('.modal').remove();">
                        ✏️ Editar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Cerrar al hacer click fuera del modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Mostrar modal de confirmación de eliminación
    showDeleteModal(id) {
        this.deleteId = id;
        document.getElementById('deleteModal').classList.add('show');
    }

    // Confirmar eliminación
    confirmDelete() {
        if (this.deleteId) {
            this.entries = this.entries.filter(entry => entry.id !== this.deleteId);
            this.saveEntries();
            this.renderEntries();
            this.closeDeleteModal();
        }
    }

    // Cerrar modal de eliminación
    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('show');
        this.deleteId = null;
    }

    // Filtrar entradas por búsqueda
    filterEntries(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderEntries();
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = this.entries.filter(entry => 
            entry.title.toLowerCase().includes(term) ||
            entry.content.toLowerCase().includes(term) ||
            entry.date.includes(term)
        );

        this.renderEntries(filtered);
    }
}

// Inicializar aplicación cuando el DOM esté listo
let diaryApp;
document.addEventListener('DOMContentLoaded', () => {
    diaryApp = new DiaryApp();
});
