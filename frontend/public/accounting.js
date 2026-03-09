const API_BASE_URL = '';

const categories = {
    expense: ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '居住', '其他'],
    income: ['工资', '奖金', '投资', '兼职', '其他']
};

let currentType = 'expense';
let records = [];
let expenseChart = null;

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
    refreshUI();
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
    refreshUI();
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
    refreshUI();
}

function refreshUI() {
    renderRecords();
    updateBalance();
    renderChart();
    generateAIAdvice();
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

function renderChart() {
    const canvas = document.getElementById('expenseChart');
    if (!canvas) return; // Guard clause if element doesn't exist

    const ctx = canvas.getContext('2d');
    
    // Aggregate expenses by category
    const expenses = records.filter(r => r.type === 'expense');
    const categoryTotals = {};
    expenses.forEach(r => {
        categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (expenseChart) {
        expenseChart.destroy();
    }

    if (data.length === 0) {
        // Clear canvas if no data
        return;
    }

    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#71B37C'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#ccc', font: { family: "'Noto Sans SC', sans-serif" } }
                }
            }
        }
    });
}

function generateAIAdvice() {
    const adviceElement = document.getElementById('aiAdvice');
    if (!adviceElement) return;

    const expenses = records.filter(r => r.type === 'expense');
    const income = records.filter(r => r.type === 'income');
    
    const totalExpense = expenses.reduce((sum, r) => sum + r.amount, 0);
    const totalIncome = income.reduce((sum, r) => sum + r.amount, 0);
    
    if (records.length === 0) {
        adviceElement.innerHTML = "您还没有任何记录。试着记下一笔账，我会为您提供财务建议！";
        return;
    }

    let advice = [];
    
    // Rule 1: Income vs Expense
    if (totalIncome > 0) {
        if (totalExpense > totalIncome) {
            advice.push("⚠️ **警告**：您的支出已超过收入！建议立即检查非必要开支，避免负债。");
        } else if (totalExpense > totalIncome * 0.8) {
            advice.push("⚠️ **注意**：您的支出已占收入的 80% 以上，储蓄空间较小。建议将支出控制在收入的 70% 以内。");
        } else {
            advice.push("✅ **太棒了**：您的财务状况良好，有健康的储蓄率。");
        }
    } else if (totalExpense > 0) {
        advice.push("⚠️ **提示**：您只有支出没有收入记录。请记得记录收入以便进行收支平衡分析。");
    }

    // Rule 2: Top Expense Category
    const categoryTotals = {};
    expenses.forEach(r => {
        categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount;
    });
    
    let maxCategory = '';
    let maxAmount = 0;
    for (const [cat, amount] of Object.entries(categoryTotals)) {
        if (amount > maxAmount) {
            maxAmount = amount;
            maxCategory = cat;
        }
    }

    if (maxCategory) {
        const percent = totalExpense > 0 ? ((maxAmount / totalExpense) * 100).toFixed(1) : 0;
        advice.push(`📊 **分析**：您最大的支出项是 **${maxCategory}**，占比 **${percent}%**。`);
        
        if (maxCategory === '餐饮' && percent > 30) {
            advice.push("💡 **建议**：餐饮开销较大。尝试每周多做几次饭，既健康又省钱！");
        } else if (maxCategory === '购物' && percent > 30) {
            advice.push("💡 **建议**：购物支出较高。建议采用“30天冷静期”法则，避免冲动消费。");
        } else if (maxCategory === '娱乐' && percent > 20) {
            advice.push("💡 **建议**：娱乐开销不低。可以寻找一些免费或低成本的休闲方式，如公园散步、阅读等。");
        }
    }

    adviceElement.innerHTML = advice.map(item => `<p style="margin-bottom: 10px;">${item}</p>`).join('');
}
