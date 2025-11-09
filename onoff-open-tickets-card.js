class OnOffOpenTicketsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.selectedStatus = 'all';
    this.entity_id = null;
    this.autoReloadInterval = null;
    this.selectedTicketForDetails = null;
  }

  setConfig(config) {
    this.config = config || {};
    // Entity is optional - will auto-detect if not provided
    this.entity_id = config.entity || null;
  }

  set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;

    // Always render when hass changes
    if (!oldHass || oldHass !== hass) {
      this.render();
    }
  }

  connectedCallback() {
    // Set up auto-reload every 30 seconds
    this.autoReloadInterval = setInterval(() => {
      if (this._hass) {
        console.log('Open Tickets Card: Auto-reloading...');
        this.render();
      }
    }, 30000);
  }

  disconnectedCallback() {
    if (this.autoReloadInterval) {
      clearInterval(this.autoReloadInterval);
    }
  }

  render() {
    if (!this._hass || !this.config) {
      console.log('Open Tickets Card: Waiting for hass or config...');
      return;
    }

    // Auto-detect entity if not configured
    let entityId = this.entity_id;
    if (!entityId && this._hass) {
      console.log('Open Tickets Card: Searching for open_tickets entity...');
      for (const entity_id in this._hass.states) {
        if (entity_id.includes('open_tickets') && entity_id.startsWith('sensor.')) {
          entityId = entity_id;
          this.entity_id = entity_id;
          console.log('Open Tickets Card: Found entity:', entity_id);
          break;
        }
      }
      if (!entityId) {
        console.error('Open Tickets Card: No open_tickets entity found');
        console.log('Open Tickets Card: Available ticket entities:', Object.keys(this._hass.states).filter(e => e.includes('ticket')));
      }
    }

    const entity = entityId ? this._hass.states[entityId] : null;

    // Debug: Log entity details
    if (entity) {
      console.log('Open Tickets Card: Entity found:', entityId);
      console.log('Open Tickets Card: Entity state:', entity.state);
      console.log('Open Tickets Card: Entity attributes:', entity.attributes);
    } else {
      console.error('Open Tickets Card: No entity found. EntityId:', entityId);
    }

    const allTickets = entity && entity.attributes && entity.attributes.tickets ? entity.attributes.tickets : [];
    console.log('Open Tickets Card: Tickets found:', allTickets.length);
    if (allTickets.length > 0) {
      console.log('Open Tickets Card: First ticket:', allTickets[0]);
    }

    // If no entity found, show error in card
    if (!entityId || !entity) {
      this.shadowRoot.innerHTML = `
        <style>
          ha-card { padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
          .error { text-align: center; }
          ul { text-align: left; max-height: 200px; overflow-y: auto; }
        </style>
        <ha-card>
          <div class="error">
            <h2>⚠️ No Tickets Entity</h2>
            <p>Looking for entity: <code>${entityId || 'auto-detect'}</code></p>
            <p><strong>Available ticket entities:</strong></p>
            <ul>
              ${Object.keys(this._hass.states).filter(e => e.includes('ticket')).map(e => `<li>${e} (state: ${this._hass.states[e].state})</li>`).join('') || '<li>None found</li>'}
            </ul>
            <p style="font-size: 12px; margin-top: 20px;">Check console for details</p>
          </div>
        </ha-card>
      `;
      return;
    }

    // Filter tickets based on selected status
    const tickets = this.selectedStatus === 'all'
      ? allTickets
      : allTickets.filter(t => (t.status || '').toLowerCase() === this.selectedStatus.toLowerCase());

    const count = tickets.length;
    const totalCount = allTickets.length;

    // Count tickets by status
    const statusCounts = {
      all: allTickets.length,
      new: 0,
      open: 0,
      'on hold': 0,
      resolved: 0,
      closed: 0
    };

    allTickets.forEach(ticket => {
      const status = (ticket.status || '').toLowerCase();
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      }
    });

    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
          background: linear-gradient(135deg, #2C3E50 0%, #3498DB 100%);
          color: white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
          margin-bottom: 16px;
        }
        .header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .status-filter {
          display: flex;
          gap: 6px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .status-btn {
          padding: 6px 12px;
          background: rgba(255,255,255,0.2);
          border: 2px solid rgba(255,255,255,0.4);
          border-radius: 6px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .status-btn:hover {
          background: rgba(255,255,255,0.3);
        }
        .status-btn.active {
          background: rgba(255,255,255,0.4);
          border-color: white;
        }
        .status-btn .badge {
          display: inline-block;
          background: rgba(255,255,255,0.3);
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
          margin-left: 4px;
        }
        .count {
          font-size: 72px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
        }
        .count-subtitle {
          text-align: center;
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 20px;
        }
        .tickets-list {
          max-height: 400px;
          overflow-y: auto;
        }
        .ticket-item {
          background: rgba(255,255,255,0.15);
          padding: 12px;
          margin-bottom: 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .ticket-item:hover {
          background: rgba(255,255,255,0.25);
        }
        .ticket-subject {
          font-weight: 600;
          margin-bottom: 6px;
        }
        .ticket-meta {
          font-size: 12px;
          opacity: 0.9;
          display: flex;
          gap: 12px;
        }
        .ticket-status {
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.3);
        }
        .ticket-status.new { background: #27AE60; }
        .ticket-status.open { background: #3498DB; }
        .ticket-status.on-hold { background: #F39C12; }
        .ticket-status.resolved { background: #9B59B6; }
        .ticket-status.closed { background: #7F8C8D; }
        .no-tickets {
          text-align: center;
          padding: 24px;
          opacity: 0.8;
          font-size: 14px;
        }
        .modal {
          display: none;
          position: fixed;
          z-index: 9999;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.7);
          animation: fadeIn 0.3s;
        }
        .modal.visible {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-content {
          background: linear-gradient(135deg, #2C3E50 0%, #3498DB 100%);
          color: white;
          padding: 24px;
          border-radius: 12px;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          animation: slideIn 0.3s;
          position: relative;
        }
        @keyframes slideIn {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid rgba(255,255,255,0.3);
        }
        .modal-header h3 {
          margin: 0;
          font-size: 20px;
        }
        .close-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .close-btn:hover {
          background: rgba(255,255,255,0.3);
        }
        .detail-row {
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(255,255,255,0.1);
          border-radius: 6px;
        }
        .detail-label {
          font-weight: 600;
          font-size: 13px;
          opacity: 0.9;
          margin-bottom: 4px;
        }
        .detail-value {
          font-size: 14px;
          line-height: 1.5;
        }
      </style>
      <ha-card>
        <div class="header" style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0;">🎫 Open Tickets</h2>
          <button class="status-btn" id="refresh-btn" style="margin: 0;" title="Refresh tickets from ITFlow">
            🔄 Refresh
          </button>
        </div>
        <div class="status-filter">
          <button class="status-btn ${this.selectedStatus === 'all' ? 'active' : ''}" data-status="all">
            All <span class="badge">${statusCounts.all}</span>
          </button>
          <button class="status-btn ${this.selectedStatus === 'new' ? 'active' : ''}" data-status="new">
            New <span class="badge">${statusCounts.new}</span>
          </button>
          <button class="status-btn ${this.selectedStatus === 'open' ? 'active' : ''}" data-status="open">
            Open <span class="badge">${statusCounts.open}</span>
          </button>
          <button class="status-btn ${this.selectedStatus === 'on hold' ? 'active' : ''}" data-status="on hold">
            On Hold <span class="badge">${statusCounts['on hold']}</span>
          </button>
          <button class="status-btn ${this.selectedStatus === 'resolved' ? 'active' : ''}" data-status="resolved">
            Resolved <span class="badge">${statusCounts.resolved}</span>
          </button>
          <button class="status-btn ${this.selectedStatus === 'closed' ? 'active' : ''}" data-status="closed">
            Closed <span class="badge">${statusCounts.closed}</span>
          </button>
        </div>
        <div class="count">${count}</div>
        ${this.selectedStatus !== 'all' ? `<div class="count-subtitle">of ${totalCount} total tickets</div>` : ''}
        <div class="tickets-list">
          ${tickets.length > 0 ? tickets.map(ticket => {
            const status = (ticket.status || 'unknown').toLowerCase().replace(' ', '-');
            return `
            <div class="ticket-item" data-ticket-id="${ticket.id || ticket.ticket_id || ''}">
              <div class="ticket-subject">#${ticket.number || ticket.ticket_number || ticket.id || '?'} - ${ticket.subject || ticket.ticket_subject || 'No Subject'}</div>
              <div class="ticket-meta">
                <span class="ticket-status ${status}">${ticket.status || 'Unknown'}</span>
                <span>Priority: ${ticket.priority || ticket.ticket_priority || 'N/A'}</span>
              </div>
            </div>
          `;
          }).join('') : '<div class="no-tickets">No tickets with this status</div>'}
        </div>
      </ha-card>

      <!-- Ticket Details Modal -->
      <div class="modal" id="ticket-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="modal-title">Ticket Details</h3>
            <button class="close-btn" id="close-modal">&times;</button>
          </div>
          <div id="modal-body"></div>
        </div>
      </div>
    `;

    // Add event listener to refresh button
    const refreshBtn = this.shadowRoot.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        console.log('Open Tickets Card: Refresh clicked');
        refreshBtn.textContent = '⏳ Refreshing...';
        refreshBtn.disabled = true;
        try {
          // Call the refresh service
          await this._hass.callService('homeassistant', 'update_entity', {
            entity_id: entityId
          });
          // Wait a moment for the sensor to update
          setTimeout(() => {
            this.render();
            refreshBtn.textContent = '🔄 Refresh';
            refreshBtn.disabled = false;
          }, 2000);
        } catch (error) {
          console.error('Error refreshing tickets:', error);
          refreshBtn.textContent = '🔄 Refresh';
          refreshBtn.disabled = false;
        }
      });
    }

    // Add event listeners to status buttons (skip refresh button)
    const statusButtons = this.shadowRoot.querySelectorAll('.status-btn:not(#refresh-btn)');
    statusButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        console.log('Open Tickets Card: Status filter clicked:', btn.dataset.status);
        this.selectedStatus = btn.dataset.status;
        this.render();
      });
    });

    // Add event listeners to ticket items
    const ticketItems = this.shadowRoot.querySelectorAll('.ticket-item');
    ticketItems.forEach((item, idx) => {
      item.addEventListener('click', () => {
        const ticketId = item.dataset.ticketId;
        console.log('Open Tickets Card: Ticket clicked:', ticketId);
        // Find the full ticket object
        const ticket = tickets[idx];
        if (ticket) {
          this.showTicketDetails(ticket);
        }
      });
    });

    // Add event listener to close modal
    const closeBtn = this.shadowRoot.getElementById('close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    // Close modal when clicking outside
    const modal = this.shadowRoot.getElementById('ticket-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }
  }

  showTicketDetails(ticket) {
    const modal = this.shadowRoot.getElementById('ticket-modal');
    const modalTitle = this.shadowRoot.getElementById('modal-title');
    const modalBody = this.shadowRoot.getElementById('modal-body');

    if (!modal || !modalTitle || !modalBody) return;

    // Set title
    modalTitle.textContent = `Ticket #${ticket.number || ticket.ticket_number || ticket.id || '?'}`;

    // Build details HTML
    const details = `
      <div class="detail-row">
        <div class="detail-label">Subject</div>
        <div class="detail-value">${ticket.subject || ticket.ticket_subject || 'No Subject'}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Status</div>
        <div class="detail-value">${ticket.status || ticket.ticket_status || 'Unknown'}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Priority</div>
        <div class="detail-value">${ticket.priority || ticket.ticket_priority || 'N/A'}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Created</div>
        <div class="detail-value">${ticket.created || ticket.ticket_created_at || 'N/A'}</div>
      </div>
      ${ticket.details || ticket.ticket_details ? `
      <div class="detail-row">
        <div class="detail-label">Details</div>
        <div class="detail-value">${ticket.details || ticket.ticket_details || ''}</div>
      </div>
      ` : ''}
      <div class="detail-row">
        <div class="detail-label">Ticket ID</div>
        <div class="detail-value">${ticket.id || ticket.ticket_id || 'Unknown'}</div>
      </div>
    `;

    modalBody.innerHTML = details;
    modal.classList.add('visible');
  }

  closeModal() {
    const modal = this.shadowRoot.getElementById('ticket-modal');
    if (modal) {
      modal.classList.remove('visible');
    }
  }

  getCardSize() {
    return 4;
  }

  static getConfigElement() {
    return document.createElement('onoff-open-tickets-card-editor');
  }

  static getStubConfig() {
    return {
      entity: 'sensor.itflow_open_tickets'
    };
  }
}

// Visual Editor
class OnOffOpenTicketsCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.render();
  }

  render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.shadowRoot.innerHTML = `
      <style>
        .config-row {
          margin: 10px 0;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box;
        }
      </style>
      <div class="config-row">
        <label>Entity (optional - auto-detects if empty)</label>
        <input type="text" id="entity" .value="${this._config.entity || ''}" placeholder="sensor.itflow_open_tickets">
      </div>
    `;

    this.shadowRoot.getElementById('entity').addEventListener('input', (e) => {
      this._config = { ...this._config, entity: e.target.value };
      this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
    });
  }
}

customElements.define('onoff-open-tickets-card', OnOffOpenTicketsCard);
customElements.define('onoff-open-tickets-card-editor', OnOffOpenTicketsCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'onoff-open-tickets-card',
  name: 'OnOff Open Tickets Card',
  description: 'Display open support tickets with status filtering',
  preview: true,
});
