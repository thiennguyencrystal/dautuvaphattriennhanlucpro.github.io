document.addEventListener('DOMContentLoaded', function() {
    // ---- CẤU HÌNH BAN ĐẦU ----
    const initialMembers = [
        { name: 'Thành viên A' }, { name: 'Thành viên B' },
        { name: 'Thành viên C' }, { name: 'Thành viên D' },
        { name: 'Thành viên E' }, { name: 'Thành viên F' }
    ];
    const PASSWORD_KEY = 'adminPasswordHash';

    // ---- LẤY CÁC THÀNH PHẦN HTML ----
    const loginSection = document.getElementById('login-section');
    const passwordInput = document.getElementById('password-input');
    const loginBtn = document.getElementById('login-btn');
    const adminContent = document.getElementById('admin-content');
    const changePasswordBtn = document.getElementById('change-password-btn');

    const electricityInput = document.getElementById('bill-electricity');
    const waterInput = document.getElementById('bill-water');
    const extraCostsContainer = document.getElementById('extra-costs-container');
    const addExtraCostBtn = document.getElementById('add-extra-cost-btn');
    const deadlineInput = document.getElementById('deadline');
    const calculateBtn = document.getElementById('calculate-btn');
    const totalBillEl = document.getElementById('total-bill');
    const membersTableBody = document.querySelector('#members-table tbody');
    const cleaningScheduleEl = document.getElementById('cleaning-schedule');

    let members = [];
    let bills = { electricity: 0, water: 0, extra: [], deadline: '' };

    // ---- LOGIC MẬT KHẨU ----
    const simpleHash = str => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash &= hash;
        }
        return hash.toString();
    };

    function checkLogin() {
        if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
            unlockAdminPanel();
        } else {
            lockAdminPanel();
        }
    }

    function unlockAdminPanel() {
        if (loginSection) loginSection.style.display = 'none';
        if (adminContent) adminContent.classList.remove('locked');
    }

    function lockAdminPanel() {
        if (loginSection) loginSection.style.display = 'block';
        if (adminContent) adminContent.classList.add('locked');
        sessionStorage.removeItem('isAdminLoggedIn');
    }

    function handleLogin() {
        const storedHash = localStorage.getItem(PASSWORD_KEY);
        const enteredPassword = passwordInput ? passwordInput.value : '';

        if (!storedHash) {
            alert('Chưa có mật khẩu. Vui lòng đặt mật khẩu lần đầu.');
            handleSetInitialPassword();
            return;
        }

        if (simpleHash(enteredPassword) === storedHash) {
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            unlockAdminPanel();
        } else {
            alert('Mật khẩu không chính xác!');
        }
        if (passwordInput) passwordInput.value = '';
    }

    function handleSetInitialPassword() {
        const newPassword = prompt('Đây là lần đầu tiên, vui lòng đặt mật khẩu admin:');
        if (newPassword) {
            localStorage.setItem(PASSWORD_KEY, simpleHash(newPassword));
            alert('Đặt mật khẩu thành công! Bây giờ hãy đăng nhập.');
        }
    }

    function handleChangePassword() {
        const storedHash = localStorage.getItem(PASSWORD_KEY);
        const currentPassword = prompt('Vui lòng nhập mật khẩu HIỆN TẠI:');

        if (!currentPassword || simpleHash(currentPassword) !== storedHash) {
            alert('Mật khẩu hiện tại không đúng. Thao tác bị hủy.');
            return;
        }

        const newPassword = prompt('Nhập mật khẩu MỚI:');
        if (!newPassword) {
            alert('Mật khẩu mới không được để trống. Thao tác bị hủy.');
            return;
        }

        const confirmPassword = prompt('Xác nhận lại mật khẩu MỚI:');
        if (newPassword !== confirmPassword) {
            alert('Mật khẩu xác nhận không khớp. Thao tác bị hủy.');
            return;
        }

        localStorage.setItem(PASSWORD_KEY, simpleHash(newPassword));
        alert('Đổi mật khẩu thành công!');
    }

    // ---- LƯU / TẢI DỮ LIỆU (an toàn) ----
    function saveData() {
        try {
            localStorage.setItem('roomData', JSON.stringify({ members, bills }));
        } catch (e) {
            console.error('Lỗi khi lưu dữ liệu:', e);
        }
    }

    function loadData() {
        let data = null;
        try {
            data = JSON.parse(localStorage.getItem('roomData'));
        } catch (e) {
            console.warn('Dữ liệu roomData không hợp lệ, sẽ khởi tạo mới.', e);
            data = null;
        }

        if (data && Array.isArray(data.members) && data.members.length > 0) {
            members = data.members;
            bills = data.bills || bills;
        } else {
            members = initialMembers.map(m => ({
                ...m, days: 30, paid: false, paidDate: null
            }));
        }
        updateUI();
    }

    // ---- UI ----
    function updateUI() {
        if (electricityInput) electricityInput.value = bills.electricity || '';
        if (waterInput) waterInput.value = bills.water || '';
        if (deadlineInput) deadlineInput.value = bills.deadline || '';

        if (extraCostsContainer) {
            extraCostsContainer.innerHTML = '';
            if (bills.extra && Array.isArray(bills.extra)) {
                bills.extra.forEach(cost => {
                    addExtraCostInput(cost.name, cost.amount);
                });
            }
        }

        calculateAndRender();
    }

    // ---- TÍNH TOÁN VÀ HIỂN THỊ ----
    function calculateAndRender() {
        // Nếu admin, đọc từ input
        if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
            bills.electricity = parseFloat(electricityInput ? electricityInput.value : 0) || 0;
            bills.water = parseFloat(waterInput ? waterInput.value : 0) || 0;
            bills.deadline = deadlineInput ? deadlineInput.value : '';
            bills.extra = [];
            document.querySelectorAll('.extra-cost-item').forEach(item => {
                const nameEl = item.querySelector('.extra-cost-name');
                const amountEl = item.querySelector('.extra-cost-amount');
                const name = nameEl ? nameEl.value : '';
                const amount = parseFloat(amountEl ? amountEl.value : 0) || 0;
                if (name && amount > 0) {
                    bills.extra.push({ name, amount });
                }
            });
        }

        const totalExtra = (bills.extra || []).reduce((sum, cost) => sum + (cost.amount || 0), 0);
        const totalBill = (bills.electricity || 0) + (bills.water || 0) + totalExtra;
        if (totalBillEl) totalBillEl.textContent = totalBill.toLocaleString('vi-VN');

        const totalPersonDays = members.reduce((sum, member) => sum + parseInt(member.days || 0), 0);
        const costPerDay = totalPersonDays > 0 ? totalBill / totalPersonDays : 0;

        if (membersTableBody) membersTableBody.innerHTML = '';
        members.forEach((member, index) => {
            const amountOwed = costPerDay * (member.days || 0);
            const row = document.createElement('tr');

            const cellName = `<td>${member.name}</td>`;
            const cellDays = `<td><input type="number" class="days-input" data-index="${index}" value="${member.days}" min="0"></td>`;
            const cellAmount = `<td>${Math.round(amountOwed).toLocaleString('vi-VN')} VNĐ</td>`;

            let cellStatus;
            if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
                const paidButtonText = member.paid ? 'Đã Đóng' : 'Chưa Đóng';
                const paidButtonClass = member.paid ? 'paid' : '';
                cellStatus = `<td><button class="paid-btn ${paidButtonClass}" data-index="${index}">${paidButtonText}</button></td>`;
            } else {
                cellStatus = `<td>${member.paid ? 'Đã đóng' : 'Chưa đóng'}</td>`;
            }

            let note = '';
            if (!member.paid && bills.deadline) {
                const deadlineDate = new Date(bills.deadline);
                const today = new Date();
                deadlineDate.setHours(0,0,0,0);
                today.setHours(0,0,0,0);

                if (today > deadlineDate) {
                    const diffTime = Math.abs(today - deadlineDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    note = `<span class="status-overdue">Quá hạn ${diffDays} ngày</span>`;
                }
            }
            const cellNote = `<td>${note}</td>`;

            row.innerHTML = cellName + cellDays + cellAmount + cellStatus + cellNote;
            membersTableBody.appendChild(row);
        });

        updateCleaningSchedule();
    }

    // ---- LỊCH TRỰC ----
    function updateCleaningSchedule() {
        if (!cleaningScheduleEl) return;
        cleaningScheduleEl.innerHTML = '';
        const paidMembers = members.filter(m => m.paid).sort((a, b) => new Date(a.paidDate) - new Date(b.paidDate));
        const unpaidMembers = members.filter(m => !m.paid);

        const scheduleOrder = [...unpaidMembers, ...paidMembers];
        const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
        scheduleOrder.forEach((member, index) => {
            const li = document.createElement('li');
            li.textContent = `${daysOfWeek[index % 7]}: ${member.name}`;
            cleaningScheduleEl.appendChild(li);
        });
    }

    // ---- SỰ KIỆN ----
    function handleTableClick(e) {
        if (sessionStorage.getItem('isAdminLoggedIn') !== 'true') return;

        const target = e.target;
        if (target.classList.contains('paid-btn')) {
            const index = target.dataset.index;
            members[index].paid = !members[index].paid;
            members[index].paidDate = members[index].paid ? new Date().toISOString() : null;
            saveData();
            calculateAndRender();
        }
    }

    function handleDaysChange(e) {
        if(e.target.classList.contains('days-input')) {
            const index = e.target.dataset.index;
            members[index].days = parseInt(e.target.value) || 0;
            // admin bấm "Lưu và Tính Toán" để persist
        }
    }

    function addExtraCostInput(name = '', amount = '') {
        const div = document.createElement('div');
        div.className = 'input-group extra-cost-item';
        div.innerHTML = `
            <input type="text" class="extra-cost-name" placeholder="Tên chi phí (vd: Internet)" value="${name}">
            <input type="number" class="extra-cost-amount" placeholder="Số tiền" value="${amount}">
        `;
        if (extraCostsContainer) extraCostsContainer.appendChild(div);
    }

    // ---- GẮN SỰ KIỆN (có kiểm tra tồn tại phần tử) ----
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
    if (changePasswordBtn) changePasswordBtn.addEventListener('click', handleChangePassword);

    if (addExtraCostBtn) addExtraCostBtn.addEventListener('click', () => addExtraCostInput());
    if (calculateBtn) calculateBtn.addEventListener('click', () => {
        calculateAndRender();
        saveData();
        alert('Đã lưu và cập nhật!');
    });
    if (membersTableBody) membersTableBody.addEventListener('click', handleTableClick);
    if (membersTableBody) membersTableBody.addEventListener('input', handleDaysChange);

    // ---- KHỞI CHẠY ----
    if (!localStorage.getItem(PASSWORD_KEY)) {
        handleSetInitialPassword();
    }
    checkLogin();
    loadData();
});
