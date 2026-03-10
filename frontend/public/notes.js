const noteForm = document.getElementById('noteForm');
const notesList = document.getElementById('notesList');

const priorityLabels = ['低', '中', '高'];
const priorityClasses = ['priority-low', 'priority-medium', 'priority-high'];

async function fetchNotes() {
    try {
        const response = await fetch('/api/notes');
        if (!response.ok) throw new Error('Failed to fetch notes');
        const notes = await response.json();
        renderNotes(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        notesList.innerHTML = '<p class="empty-message">加载失败，请稍后重试</p>';
    }
}

function renderNotes(notes) {
    if (!notes || notes.length === 0) {
        notesList.innerHTML = '<p class="empty-message">暂无笔记</p>';
        return;
    }

    notesList.innerHTML = '';
    notes.forEach(note => {
        const noteEl = createNoteElement(note);
        notesList.appendChild(noteEl);
    });
}

function createNoteElement(note) {
    const div = document.createElement('div');
    div.className = `note-item ${note.IsCompleted ? 'completed' : ''}`;
    div.dataset.id = note.ID;

    const priorityClass = priorityClasses[note.Priority] || priorityClasses[1];
    const priorityLabel = priorityLabels[note.Priority] || priorityLabels[1];

    let metaHtml = `<span class="priority-badge ${priorityClass}">${priorityLabel}</span>`;
    if (note.Tags) {
        metaHtml += `<span>🏷️ ${note.Tags}</span>`;
    }
    if (note.DueDate) {
        metaHtml += `<span>📅 ${note.DueDate}</span>`;
    }

    div.innerHTML = `
        <div class="note-header">
            <div>
                <h3 class="note-title">${escapeHtml(note.Title)}</h3>
                ${note.Content ? `<p class="note-content">${escapeHtml(note.Content)}</p>` : ''}
                <div class="note-meta">${metaHtml}</div>
            </div>
            <div class="note-actions">
                <button class="action-btn complete" onclick="toggleComplete(${note.ID}, ${!note.IsCompleted})">
                    ${note.IsCompleted ? '✓ 已完成' : '✓ 完成'}
                </button>
                <button class="action-btn delete" onclick="deleteNote(${note.ID})">🗑️ 删除</button>
            </div>
        </div>
    `;

    return div;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const priority = parseInt(document.getElementById('notePriority').value);
    const tags = document.getElementById('noteTags').value.trim();
    const dueDate = document.getElementById('noteDueDate').value;

    if (!title) {
        alert('请输入标题！');
        return;
    }

    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Title: title,
                Content: content,
                Priority: priority,
                Tags: tags,
                DueDate: dueDate,
                IsCompleted: false
            })
        });

        if (!response.ok) throw new Error('Failed to add note');
        
        noteForm.reset();
        fetchNotes();
    } catch (error) {
        console.error('Error adding note:', error);
        alert('添加失败，请稍后重试');
    }
});

async function toggleComplete(id, isCompleted) {
    try {
        const response = await fetch(`/api/notes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ IsCompleted: isCompleted })
        });

        if (!response.ok) throw new Error('Failed to update note');
        fetchNotes();
    } catch (error) {
        console.error('Error updating note:', error);
        alert('更新失败，请稍后重试');
    }
}

async function deleteNote(id) {
    if (!confirm('确定要删除这条笔记吗？')) return;

    try {
        const response = await fetch(`/api/notes/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete note');
        fetchNotes();
    } catch (error) {
        console.error('Error deleting note:', error);
        alert('删除失败，请稍后重试');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchNotes();
});
