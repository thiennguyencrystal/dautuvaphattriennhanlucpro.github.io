document.addEventListener('DOMContentLoaded', function() {
    // ---- CẤU HÌNH BAN ĐẦU ----
    // Thay đổi tên thành viên trong phòng của bạn ở đây
    const initialMembers = [
        { name: 'Thành viên A' },
        { name: 'Thành viên B' },
        { name: 'Thành viên C' },
        { name: 'Thành viên D' },
        { name: 'Thành viên E' },
        { name: 'Thành viên F' }
    ];

    // ---- LẤY CÁC THÀNH PHẦN HTML ----
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

    // ---- HÀM LƯU VÀ TẢI DỮ LIỆU ----
    function saveData() {
        localStorage.setItem('roomData', JSON.stringify({ members, bills }));
    }

    function loadData() {
        const data = JSON.parse(localStorage.getItem('roomData'));
        if (data && data.members.length > 0) {
            members = data.members;
            bills = data.bills;
        } else {
            // Khởi tạo lần đầu
            members = initialMembers.map(m => ({
                ...m,
                days: 30, // Mặc định ở 30 ngày
                paid: false,
                paidDate: null
            }));
        }
        updateUI();
    }

    // ---- HÀM CẬP NHẬT GIAO DIỆN ----
    function updateUI() {
        // Cập nhật các ô input của admin
        electricityInput.value = bills.electricity || '';
        waterInput.value = bills.water || '';
        deadlineInput.value = bills.deadline || '';
        
        extraCostsContainer.innerHTML = '';
        bills.extra.forEach((cost, index) => {
            addExtraCostInput(cost.name, cost.amount);
        });

        // Tính toán và hiển thị
        calculateAndRender();
    }
    
    // ---- HÀM TÍNH TOÁN VÀ HIỂN THỊ ----
    function calculateAndRender() {
        // Cập nhật lại giá trị bill từ input
        bills.electricity = parseFloat(electricityInput.value) || 0;
        bills.water = parseFloat(waterInput.value) || 0;
        bills.deadline = deadlineInput.value;
        bills.extra = [];
        document.querySelectorAll('.extra-cost-item').forEach(item => {
            const name = item.querySelector('.extra-cost-name').value;
            const amount = parseFloat(item.querySelector('.extra-cost-amount').value) || 0;
            if (name && amount > 0) {
                bills.extra.push({ name, amount });
            }
        });

        const totalExtra = bills.extra.reduce((sum, cost) => sum + cost.amount, 0);
        const totalBill = bills.electricity + bills.water + totalExtra;
        totalBillEl.textContent = totalBill.toLocaleString('vi-VN');

        const totalPersonDays = members.reduce((sum, member) => sum + parseInt(member.days || 0), 0);
        const costPerDay = totalPersonDays > 0 ? totalBill / totalPersonDays : 0;

        membersTableBody.innerHTML = ''; // Xóa bảng cũ
        members.forEach((member, index) => {
            const amountOwed = costPerDay * member.days;
            const row = document.createElement('tr');

            // Cột tên
            const cellName = `<td>${member.name}</td>`;
            
            // Cột số ngày ở
            const cellDays = `<td><input type="number" class="days-input" data-index="${index}" value="${member.days}" min="0"></td>`;

            // Cột số tiền
            const cellAmount = `<td>${Math.round(amountOwed).toLocaleString('vi-VN')} VNĐ</td>`;
            
            // Cột trạng thái
            const paidButtonText = member.paid ? 'Đã Đóng' : 'Chưa Đóng';
            const paidButtonClass = member.paid ? 'paid' : '';
            const cellStatus = `<td><button class="paid-btn ${paidButtonClass}" data-index="${index}">${paidButtonText}</button></td>`;
            
            // Cột ghi chú (quá hạn)
            let note = '';
            if (!member.paid && bills.deadline) {
                const deadlineDate = new Date(bills.deadline);
                const today = new Date();
                // Set hours to 0 to compare dates only
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

    // ---- HÀM CẬP NHẬT LỊCH TRỰC ----
    function updateCleaningSchedule() {
        cleaningScheduleEl.innerHTML = '';
        const paidMembers = members.filter(m => m.paid).sort((a, b) => new Date(a.paidDate) - new Date(b.paidDate));
        const unpaidMembers = members.filter(m => !m.paid);

        // Ai chưa đóng tiền thì trực trước, ai đóng rồi thì trực sau (đóng trước trực sau cùng)
        const scheduleOrder = [...unpaidMembers, ...paidMembers];
        
        const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
        scheduleOrder.forEach((member, index) => {
            const li = document.createElement('li');
            li.textContent = `${daysOfWeek[index % 7]}: ${member.name}`;
            cleaningScheduleEl.appendChild(li);
        });
    }

    // ---- HÀM XỬ LÝ SỰ KIỆN ----
    function handleTableClick(e) {
        const target = e.target;
        // Xử lý nút Đóng tiền
        if (target.classList.contains('paid-btn')) {
            const index = target.dataset.index;
            members[index].paid = !members[index].paid;
            if (members[index].paid) {
                members[index].paidDate = new Date(); // Ghi lại thời gian đóng tiền
            } else {
                members[index].paidDate = null;
            }
            saveData();
            calculateAndRender();
        }
    }
    
    function handleDaysChange(e) {
        if(e.target.classList.contains('days-input')) {
            const index = e.target.dataset.index;
            members[index].days = parseInt(e.target.value) || 0;
            // Không lưu ngay để tránh lưu liên tục, chỉ khi bấm nút "Tính toán" mới lưu
        }
    }

    function addExtraCostInput(name = '', amount = '') {
        const div = document.createElement('div');
        div.className = 'input-group extra-cost-item';
        div.innerHTML = `
            <input type="text" class="extra-cost-name" placeholder="Tên chi phí (vd: Internet)" value="${name}">
            <input type="number" class="extra-cost-amount" placeholder="Số tiền" value="${amount}">
        `;
        extraCostsContainer.appendChild(div);
    }
    
    // ---- GẮN CÁC BỘ LẮNG NGHE SỰ KIỆN ----
    addExtraCostBtn.addEventListener('click', () => addExtraCostInput());
    calculateBtn.addEventListener('click', () => {
        calculateAndRender();
        saveData();
        alert('Đã lưu và cập nhật!');
    });
    membersTableBody.addEventListener('click', handleTableClick);
    membersTableBody.addEventListener('input', handleDaysChange);

    // ---- KHỞI CHẠY ----
    loadData();
});