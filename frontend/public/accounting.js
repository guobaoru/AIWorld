const API_BASE_URL = '';

const categories = {
    expense: ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '居住', '其他'],
    income: ['工资', '奖金', '投资', '兼职', '其他']
};

let currentType = 'expense';
let records = [];

document.addEventListener('DOMContentLoaded', () => {
    initializeDate();
    initializeCategories();
    setupEventListeners();
    loadRecords();
});

function initializeDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

function initializeCategories() {
    updateCategoryOptions();
}

function updateCategoryOptions() {
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = '<option value="">请选择分类</option>';
    
    categories[currentType].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

function setupEventListeners() {
    const typeBtns = document.querySelectorAll('.type-btn');
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentType = btn.dataset.type;
            updateCategoryOptions();
        });
    });

    document.getElementById('recordForm').addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const record = {
        type: currentType,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        date: document.getElementById('date').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/accounting/records`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(record)
        });

        if (response.ok) {
            document.getElementById('recordForm').reset();
            initializeDate();
            loadRecords();
        }
    } catch (error) {
        console.error('Error adding record:', error);
        addRecordLocally(record);
    }
}

function addRecordLocally(record) {
    record.id = Date.now();
    records.push(record);
    saveRecordsToLocal();
    renderRecords();
    updateBalance();
    document.getElementById('recordForm').reset();
    initializeDate();
}

async function loadRecords() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/accounting/records`);
        if (response.ok) {
            records = await response.json();
        } else {
            loadRecordsFromLocal();
        }
    } catch (error) {
        console.error('Error loading records:', error);
        loadRecordsFromLocal();
    }
    renderRecords();
    updateBalance();
}

function loadRecordsFromLocal() {
    const saved = localStorage.getItem('accountingRecords');
    records = saved ? JSON.parse(saved) : [];
}

function saveRecordsToLocal() {
    localStorage.setItem('accountingRecords', JSON.stringify(records));
}

async function deleteRecord(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/accounting/records/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete from server');
        }
    } catch (error) {
        console.error('Error deleting record:', error);
    }

    records = records.filter(r => r.id !== id);
    saveRecordsToLocal();
    renderRecords();
    updateBalance();
}

function renderRecords() {
    const recordsList = document.getElementById('recordsList');
    
    if (records.length === 0) {
        recordsList.innerHTML = '<p class="empty-message">暂无记录</p>';
        return;
    }

    const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    recordsList.innerHTML = sortedRecords.map(record => `
        <div class="record-item ${record.type}">
            <div class="record-info">
                <div class="record-category">${record.category}</div>
                <div class="record-details">
                    <span class="record-date">${record.date}</span>
                    ${record.description ? `<span class="record-desc">${record.description}</span>` : ''}
                </div>
            </div>
            <div class="record-amount">
                <span class="amount-value">${record.type === 'income' ? '+' : '-'}¥${record.amount.toFixed(2)}</span>
                <button class="delete-btn" onclick="deleteRecord(${record.id})">删除</button>
            </div>
        </div>
    `).join('');
}

function updateBalance() {
    const totalIncome = records
        .filter(r => r.type === 'income')
        .reduce((sum, r) => sum + r.amount, 0);
    
    const totalExpense = records
        .filter(r => r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0);
    
    const netBalance = totalIncome - totalExpense;

    document.getElementById('totalIncome').textContent = `¥${totalIncome.toFixed(2)}`;
    document.getElementById('totalExpense').textContent = `¥${totalExpense.toFixed(2)}`;
    document.getElementById('netBalance').textContent = `¥${netBalance.toFixed(2)}`;
}
