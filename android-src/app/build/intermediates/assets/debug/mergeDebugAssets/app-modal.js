/**
 * ApexDeco - Styled Alert/Confirm Modal Replacements
 * Replaces native alert() and confirm() with themed modal dialogs.
 */

function showAlert(message, callback) {
    _showModal(message, false, callback);
}

function showConfirm(message, onOk, onCancel) {
    _showModal(message, true, onOk, onCancel);
}

function _showModal(message, isConfirm, onOk, onCancel) {
    // Remove any existing alert modal
    const existing = document.getElementById('alert-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'alert-modal';
    overlay.className = 'modal-overlay active';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s ease';

    let buttonsHTML;
    if (isConfirm) {
        buttonsHTML = `
            <button class="btn btn-outline" id="alert-modal-cancel">Cancel</button>
            <button class="btn btn-outline" id="alert-modal-ok">OK</button>`;
    } else {
        buttonsHTML = `
            <button class="btn btn-outline" id="alert-modal-ok">OK</button>`;
    }

    overlay.innerHTML = `
        <div class="modal" style="transform:scale(0.95); transition:transform 0.2s ease">
            <h3>MultiDeco</h3>
            <div class="alert-modal-text">${message}</div>
            <div class="btn-group" style="justify-content:center; margin-top:12px;">${buttonsHTML}</div>
        </div>`;

    document.body.appendChild(overlay);

    // Fade in on next frame
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        overlay.querySelector('.modal').style.transform = 'scale(1)';
    });

    function close(cb) {
        overlay.style.opacity = '0';
        overlay.querySelector('.modal').style.transform = 'scale(0.95)';
        setTimeout(() => {
            overlay.remove();
            if (cb) cb();
        }, 200);
    }

    document.getElementById('alert-modal-ok').addEventListener('click', () => {
        close(onOk);
    });

    if (isConfirm) {
        document.getElementById('alert-modal-cancel').addEventListener('click', () => {
            close(onCancel);
        });
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(onCancel);
        });
    } else {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(onOk);
        });
    }
}
