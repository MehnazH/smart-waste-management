(function () {
    "use strict";

    const STORAGE_KEY = 'smart_waste_reports';

    // DOM elements
    const form = document.getElementById('reportForm');
    const locationInput = document.getElementById('location');
    const wasteTypeSelect = document.getElementById('wasteType');
    const descriptionInput = document.getElementById('description');
    const imageUrlInput = document.getElementById('imageUrl');
    const reportsContainer = document.getElementById('reportsContainer');
    const emptyStateDiv = document.getElementById('emptyState');
    const refreshBtn = document.getElementById('refreshBtn');

    const STATUS_OPTIONS = ['Reported', 'In Progress', 'Resolved'];

    // Helper: localStorage
    function loadReports() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try { return JSON.parse(stored); }
            catch (e) { return []; }
        }
        return [];
    }

    function saveReports(reports) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    }

    function generateId() {
        return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    function formatDate(isoString) {
        const d = new Date(isoString);
        return d.toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    function escapeHTML(str) {
        if (!str) return str;
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Render reports
    function renderReports() {
        const reports = loadReports();

        if (reports.length === 0) {
            reportsContainer.innerHTML = '';
            emptyStateDiv.style.display = 'block';
            return;
        }

        emptyStateDiv.style.display = 'none';
        const sorted = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        let html = '';
        sorted.forEach(report => {
            const statusClass =
                report.status === 'Reported' ? 'status-reported' :
                    (report.status === 'In Progress' ? 'status-progress' : 'status-resolved');

            const imageHtml = report.imageUrl ? `
        <div class="image-thumb">
          <img src="${escapeHTML(report.imageUrl)}" alt="waste" loading="lazy" onerror="this.style.display='none'">
        </div>
      ` : '';

            const descriptionHtml = report.description ? `
        <div class="desc-box">${escapeHTML(report.description)}</div>
      ` : '';

            const statusOptions = STATUS_OPTIONS.map(opt =>
                `<option value="${opt}" ${opt === report.status ? 'selected' : ''}>${opt}</option>`
            ).join('');

            const statusSelect = `
        <select class="status-select" data-id="${report.id}">
          ${statusOptions}
        </select>
      `;

            html += `
        <div class="report-card" data-report-id="${report.id}">
          <div class="card-top">
            <span class="waste-badge">${escapeHTML(report.wasteType)}</span>
            <span class="status ${statusClass}">${escapeHTML(report.status)}</span>
          </div>
          <div class="loc"><span>📍</span> ${escapeHTML(report.location)}</div>
          ${descriptionHtml}
          ${imageHtml}
          <div class="timestamp">📅 ${formatDate(report.createdAt)}</div>
          <div class="action-bar">
            ${statusSelect}
            <button class="btn btn-small btn-danger delete-btn" data-id="${report.id}">🗑️ Delete</button>
          </div>
        </div>
      `;
        });

        reportsContainer.innerHTML = html;
        attachCardEvents();
    }

    function attachCardEvents() {
        // Status change
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', function (e) {
                const reportId = this.dataset.id;
                const newStatus = this.value;

                const reports = loadReports();
                const reportIndex = reports.findIndex(r => r.id === reportId);
                if (reportIndex === -1) return;

                reports[reportIndex].status = newStatus;
                saveReports(reports);

                const card = this.closest('.report-card');
                const statusBadge = card.querySelector('.status');
                statusBadge.textContent = newStatus;
                statusBadge.className = `status ${newStatus === 'Reported' ? 'status-reported' : (newStatus === 'In Progress' ? 'status-progress' : 'status-resolved')}`;
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const reportId = this.dataset.id;
                if (!confirm('Delete this report permanently?')) return;

                let reports = loadReports();
                reports = reports.filter(r => r.id !== reportId);
                saveReports(reports);
                renderReports();
            });
        });
    }

    function handleSubmit(e) {
        e.preventDefault();

        const location = locationInput.value.trim();
        const wasteType = wasteTypeSelect.value;
        const description = descriptionInput.value.trim();
        const imageUrl = imageUrlInput.value.trim();

        if (!location || !wasteType) {
            alert('❌ Please fill in Location and Waste type.');
            return;
        }

        const newReport = {
            id: generateId(),
            location: location,
            wasteType: wasteType,
            description: description || '',
            imageUrl: imageUrl || '',
            status: 'Reported',
            createdAt: new Date().toISOString()
        };

        const reports = loadReports();
        reports.push(newReport);
        saveReports(reports);

        form.reset();
        renderReports();
        document.querySelector('.dash-header').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function refreshDashboard() {
        renderReports();
    }

    function init() {
        renderReports();
        form.addEventListener('submit', handleSubmit);
        refreshBtn.addEventListener('click', refreshDashboard);
    }

    init();
})();