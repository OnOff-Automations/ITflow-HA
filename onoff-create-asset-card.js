class OnOffCreateAssetCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.rendered) {
      this.render();
      this.rendered = true;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
          background: linear-gradient(135deg, #16A085 0%, #27AE60 100%);
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
        .form-group {
          margin-bottom: 12px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        label {
          display: block;
          font-weight: 600;
          margin-bottom: 6px;
          font-size: 14px;
        }
        input, textarea, select {
          width: 100%;
          padding: 10px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 6px;
          background: rgba(255,255,255,0.9);
          color: #333;
          font-size: 14px;
          box-sizing: border-box;
        }
        textarea {
          min-height: 80px;
          resize: vertical;
          font-family: inherit;
        }
        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: rgba(255,255,255,0.8);
          background: white;
        }
        .submit-btn {
          width: 100%;
          padding: 12px;
          background: rgba(255,255,255,0.25);
          border: 2px solid white;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 8px;
        }
        .submit-btn:hover {
          background: rgba(255,255,255,0.35);
          transform: translateY(-2px);
        }
        .submit-btn:active {
          transform: translateY(0);
        }
        .success-message {
          background: rgba(76, 175, 80, 0.9);
          padding: 12px;
          border-radius: 6px;
          margin-top: 12px;
          display: none;
        }
        .error-message {
          background: rgba(244, 67, 54, 0.9);
          padding: 12px;
          border-radius: 6px;
          margin-top: 12px;
          display: none;
        }
      </style>
      <ha-card>
        <div class="header">
          <h2>🖥️ Register Asset</h2>
        </div>
        <form id="asset-form">
          <div class="form-group">
            <label for="asset-name">Asset Name *</label>
            <input type="text" id="asset-name" required placeholder="e.g., Server Room - Dell PowerEdge">
          </div>
          <div class="form-group">
            <label for="asset-type">Asset Type *</label>
            <select id="asset-type" required>
              <option value="">Select Type</option>
              <option value="Server">Server</option>
              <option value="Workstation">Workstation</option>
              <option value="Laptop">Laptop</option>
              <option value="Desktop">Desktop</option>
              <option value="Printer">Printer</option>
              <option value="Network Switch">Network Switch</option>
              <option value="Router">Router</option>
              <option value="Firewall">Firewall</option>
              <option value="Access Point">Access Point</option>
              <option value="Camera">Camera</option>
              <option value="Phone">Phone</option>
              <option value="Tablet">Tablet</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="asset-make">Make</label>
              <input type="text" id="asset-make" placeholder="e.g., Dell">
            </div>
            <div class="form-group">
              <label for="asset-model">Model</label>
              <input type="text" id="asset-model" placeholder="e.g., PowerEdge R740">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="asset-serial">Serial Number</label>
              <input type="text" id="asset-serial" placeholder="ABC123456">
            </div>
            <div class="form-group">
              <label for="asset-os">Operating System</label>
              <input type="text" id="asset-os" placeholder="e.g., Ubuntu 22.04">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="asset-ip">IP Address</label>
              <input type="text" id="asset-ip" placeholder="192.168.1.100">
            </div>
            <div class="form-group">
              <label for="asset-mac">MAC Address</label>
              <input type="text" id="asset-mac" placeholder="00:11:22:33:44:55">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="asset-purchase">Purchase Date</label>
              <input type="date" id="asset-purchase">
            </div>
            <div class="form-group">
              <label for="asset-warranty">Warranty Expiration</label>
              <input type="date" id="asset-warranty">
            </div>
          </div>
          <div class="form-group">
            <label for="asset-notes">Notes</label>
            <textarea id="asset-notes" placeholder="Additional information about this asset"></textarea>
          </div>
          <button type="submit" class="submit-btn">Register Asset</button>
          <div class="success-message" id="success-msg">✓ Asset registered successfully!</div>
          <div class="error-message" id="error-msg">✗ Failed to register asset. Please try again.</div>
        </form>
      </ha-card>
    `;

    const form = this.shadowRoot.getElementById('asset-form');
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  async handleSubmit(e) {
    e.preventDefault();

    const assetName = this.shadowRoot.getElementById('asset-name').value;
    const assetType = this.shadowRoot.getElementById('asset-type').value;
    const assetMake = this.shadowRoot.getElementById('asset-make').value;
    const assetModel = this.shadowRoot.getElementById('asset-model').value;
    const assetSerial = this.shadowRoot.getElementById('asset-serial').value;
    const assetOs = this.shadowRoot.getElementById('asset-os').value;
    const assetIp = this.shadowRoot.getElementById('asset-ip').value;
    const assetMac = this.shadowRoot.getElementById('asset-mac').value;
    const assetPurchase = this.shadowRoot.getElementById('asset-purchase').value;
    const assetWarranty = this.shadowRoot.getElementById('asset-warranty').value;
    const assetNotes = this.shadowRoot.getElementById('asset-notes').value;

    const successMsg = this.shadowRoot.getElementById('success-msg');
    const errorMsg = this.shadowRoot.getElementById('error-msg');

    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    // Validate required fields
    if (!assetName || assetName.trim() === '') {
      errorMsg.textContent = '✗ Asset name is required';
      errorMsg.style.display = 'block';
      setTimeout(() => errorMsg.style.display = 'none', 5000);
      return;
    }

    if (!assetType) {
      errorMsg.textContent = '✗ Please select an asset type';
      errorMsg.style.display = 'block';
      setTimeout(() => errorMsg.style.display = 'none', 5000);
      return;
    }

    console.log('Creating asset:', assetName, 'Type:', assetType);

    try {
      await this._hass.callService('onoff_itflow', 'create_asset', {
        asset_name: assetName,
        asset_type: assetType,
        asset_make: assetMake || undefined,
        asset_model: assetModel || undefined,
        asset_serial: assetSerial || undefined,
        asset_os: assetOs || undefined,
        asset_ip: assetIp || undefined,
        asset_mac: assetMac || undefined,
        asset_purchase: assetPurchase || undefined,
        asset_warranty_expire: assetWarranty || undefined,
        asset_notes: assetNotes || undefined,
      });

      successMsg.style.display = 'block';

      // Reset form
      this.shadowRoot.getElementById('asset-form').reset();

      // Hide success message after 3 seconds
      setTimeout(() => {
        successMsg.style.display = 'none';
      }, 3000);

    } catch (error) {
      console.error('Error creating asset:', error);
      errorMsg.textContent = `✗ Error: ${error.message || 'Failed to register asset'}`;
      errorMsg.style.display = 'block';
      setTimeout(() => {
        errorMsg.style.display = 'none';
      }, 5000);
    }
  }

  getCardSize() {
    return 5;
  }

  static getConfigElement() {
    return document.createElement('onoff-create-asset-card-editor');
  }

  static getStubConfig() {
    return {};
  }
}

// Visual Editor
class OnOffCreateAssetCardEditor extends HTMLElement {
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
        .config-info {
          padding: 16px;
          background: #f5f5f5;
          border-radius: 4px;
        }
      </style>
      <div class="config-info">
        <p><strong>OnOff Create Asset Card</strong></p>
        <p>This card has no configuration options. It uses the OnOff ITFlow integration to create assets.</p>
      </div>
    `;
  }
}

customElements.define('onoff-create-asset-card', OnOffCreateAssetCard);
customElements.define('onoff-create-asset-card-editor', OnOffCreateAssetCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'onoff-create-asset-card',
  name: 'OnOff Create Asset Card',
  description: 'Form to register new assets',
  preview: true,
});
