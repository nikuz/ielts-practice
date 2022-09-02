let startTime = Date.now();
let timer;
let counter = 0;
let score = 0;
const acceptedTestTypes = ['listening', 'reading', 'writing'];
let testType = acceptedTestTypes[0];
let started = false;
const durationTable = {
    listening: 30,
    reading: 60,
    writing: 60,
};
let duration = durationTable[testType];
const scoresTable = {
    listening: {
        4:      [11, 12],
        4.5:    [13, 15],
        5:      [16, 17],
        5.5:    [18, 22],
        6:      [23, 25],
        6.5:    [26, 29],
        7:      [30, 31],
        7.5:    [32, 34],
        8:      [35, 36],
        8.5:    [37, 38],
        9:      [39, 40],
    },
    reading: {
        2.5:    [6, 8],
        3:      [9, 11],
        3.5:    [12, 14],
        4:      [15, 18],
        4.5:    [19, 22],
        5:      [23, 26],
        5.5:    [27, 29],
        6:      [30, 31],
        6.5:    [32, 33],
        7:      [34, 35],
        7.5:    [36],
        8:      [37, 38],
        8.5:    [39],
        9:      [40],
    },
};

function createFields() {
    const textAreasContainer = document.getElementById('text-areas');
    textAreasContainer.innerHTML = '';

    const templateContainer = document.getElementById('fields-template');
    const template = templateContainer.innerHTML;
    const listContainer = document.getElementById('questions-list');
    listContainer.innerHTML = '';

    for (let i = 0, l = 40; i < l; i++) {
        const el = document.createElement('li');
        el.className = 'question-item';
        el.innerHTML = template;
        listContainer.appendChild(el);
    }
    document.getElementById('counter').innerText = counter;
    document.getElementById('score').innerText = score;
}

function fieldChangeHandler() {
    if (!started) {
        start();
    }
}

function checkQuestion(el) {
    const cl = 'checked';
    if (el.classList.contains(cl)) {
        counter--;
        el.classList.remove(cl);
    } else {
        counter++;
        el.classList.add(cl);
    }
    document.getElementById('counter').innerText = counter;
    setScore();
}

function createTextAreas() {
    const questionListContainer = document.getElementById('questions-list');
    questionListContainer.innerHTML = '';

    const templateContainer = document.getElementById('text-areas-template');
    const template = templateContainer.innerHTML;
    const areasContainer = document.getElementById('text-areas');
    areasContainer.innerHTML = '';

    for (let i = 0, l = 2; i < l; i++) {
        const el = document.createElement('div');
        const targetAmount = i === 0 ? 150 : 250;
        el.className = 'text-area-container-item';
        el.innerHTML = template;
        el.setAttribute('data-part', (i + 1).toString());

        const titleEl = el.querySelector('.text-area-title');
        if (titleEl) {
            titleEl.innerText = `Part ${i === 0 ? 1 : 2}`;
        }

        const wordTargetEl = el.querySelector('.word-target');
        if (wordTargetEl) {
            wordTargetEl.innerHTML = `Target: >= <b>${targetAmount}</b> words`;
        }

        const textareaEl = el.querySelector('.textarea');
        if (textareaEl) {
            textareaEl.setAttribute('data-target', targetAmount.toString());
        }

        showSavedEssays(el);

        areasContainer.appendChild(el);
    }
}

function textAreaGenerateContainerId(part, question) {
    return `${part}-${question.trim().substring(0, 50)}`
}

function textAreaAutoSave(containerEl) {
    const existingId = containerEl.getAttribute('data-id');
    const part = containerEl.getAttribute('data-part');
    const questionEl = containerEl.querySelector('.writing-question');
    const textAreaEl = containerEl.querySelector('.textarea');
    const newId = textAreaGenerateContainerId(part, questionEl.innerText);

    if (existingId !== newId) {
        localStorage.removeItem(existingId);
        containerEl.setAttribute('data-id', newId);
    }

    localStorage.setItem(newId, JSON.stringify({
        question: questionEl.innerText,
        text: textAreaEl.innerText,
    }));
    showSavedEssays(containerEl);
}

let keyDownDebounceTimer;

function textAreaQuestionChangeHandler(el) {
    const debounce = () => {
        const containerEl = el.closest('.text-area-container-item');
        textAreaAutoSave(containerEl);
    };

    clearTimeout(keyDownDebounceTimer);
    keyDownDebounceTimer = setTimeout(debounce, 200);
}

function textAreaCountWords(containerEl) {
    const textAreaEl = containerEl.querySelector('.textarea');
    const value = textAreaEl.innerText;
    const target = Number(textAreaEl.getAttribute('data-target'));
    const words = value.split(/\s+/).filter(item => item !== '');
    const counter = words.length;
    const targetIsAchieved = counter >= target;

    const counterEl = containerEl.querySelector('.word-counter');
    counterEl.innerHTML = `<b class="${targetIsAchieved ? 'success' : 'error'}">${counter}</b> word${counter === 1 ? '' : 's'}`;
}

function textAreaChangeHandler(el) {
    const debounce = () => {
        const containerEl = el.closest('.text-area-container-item');
        textAreaCountWords(containerEl);
        textAreaAutoSave(containerEl);

        if (!started) {
            start();
        }
    };

    clearTimeout(keyDownDebounceTimer);
    keyDownDebounceTimer = setTimeout(debounce, 200);
}

function textAreaCheckSpelling(el) {
    const containerEl = el.closest('.text-area-container-item');
    const textAreaEl = containerEl.querySelector('.textarea');
    if (textAreaEl) {
        textAreaEl.spellcheck = true;
        textAreaEl.contentEditable = 'true';
        textAreaEl.classList.remove('disabled');
        textAreaEl.focus();
    }
}

function showSavedEssays(containerEl) {
    const selector = containerEl.querySelector('.text-areas-saved-essays');
    const part = containerEl.getAttribute('data-part');
    if (selector) {
        selector.innerHTML = '';
        selector.appendChild(document.createElement('option'));
        const savedEssays = [];
        for (let i = 0, l = localStorage.length; i < l; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(part)) {
                savedEssays.push(key);
            }
        }
        if (savedEssays.length) {
            savedEssays.forEach(item => {
                const option = document.createElement('option');
                option.value = item;
                option.innerText = item;
                selector.appendChild(option);
            });
        }
    }
}

function textAreaLoadWriting(el) {
    const value = el.value;
    const containerEl = el.closest('.text-area-container-item');

    if (value && confirm(`Load "${value}" essay?`)) {
        const essay = JSON.parse(localStorage.getItem(value));

        const questionEl = containerEl.querySelector('.writing-question');
        if (questionEl) {
            questionEl.innerText = essay.question;
        }

        const textAreaEl = containerEl.querySelector('.textarea');
        if (textAreaEl) {
            textAreaEl.innerText = essay.text;
        }

        const part = containerEl.getAttribute('data-part');
        containerEl.setAttribute('data-id', textAreaGenerateContainerId(part, essay.question));
        textAreaCountWords(containerEl);

        const buttonsContainer = containerEl.querySelector('.text-areas-buttons');
        if (buttonsContainer) {
            const deleteButton = containerEl.querySelector('.delete-essay-button');
            if (!deleteButton) {
                const deleteButton = document.createElement('button');
                deleteButton.className = 'button delete-essay-button';
                deleteButton.textContent = '❌';
                deleteButton.title = 'Remove essay from local storage';
                deleteButton.onclick = textAreaDeleteWriting;
                buttonsContainer.appendChild(deleteButton);
            }
        }
    } else {
        el.value = '';
        const buttonsContainer = containerEl.querySelector('.text-areas-buttons');
        const deleteButton = containerEl.querySelector('.delete-essay-button');
        if (buttonsContainer && deleteButton) {
            buttonsContainer.removeChild(deleteButton);
        }
    }
}

function textAreaDeleteWriting(event) {
    const el = event.target;
    const containerEl = el.closest('.text-area-container-item');
    const selector = containerEl.querySelector('.text-areas-saved-essays');
    const buttonsContainer = containerEl.querySelector('.text-areas-buttons');

    if (selector) {
        const value = selector.value;
        if (value) {
            const optionEl = selector.querySelector(`option[value="${value}"]`);
            if (optionEl) {
                localStorage.removeItem(value);
                selector.removeChild(optionEl);
                selector.value = '';
                buttonsContainer.removeChild(el);
            }
        }
    }
}

function setScore() {
    const scoreEl = document.getElementById('score');
    const scores = scoresTable[testType];
    if (!scores) {
        scoreEl.innerText = '0';
        return;
    }
    const scoresList = Object.keys(scores).map(Number);
    scoresList.sort((a, b) => a - b);

    for (let i = 0, l = scoresList.length; i < l; i++) {
        const scoreItem = scoresList[i];
        const range = scores[scoreItem];
        if (
            (range.length === 1 && counter === range[0])
            || (range.length > 1 && counter >= range[0] && counter <= range[1])
        ) {
            score = scoreItem;
        }
    }

    scoreEl.innerText = score;
}

function setTestType(el) {
    if (testType === 'writing') {
        createFields();
    }
    if (el.value === 'writing') {
        createTextAreas();
    }

    testType = el.value;
    duration = durationTable[testType];

    if (!started) {
        startTime = Date.now();
        tick();
    }
    setScore();
    setPageTitle();
    history.pushState(null, null, `#${testType}`);
}

function tick() {
    const time = (duration * 60) - ((Date.now() - startTime) / 1000);
    const roundedTime = Math.round(time) / 60;
    let minutes = Math.trunc(roundedTime);
    let seconds = Math.round(remapValue({
        value: roundedTime - minutes,
        inMin: 0,
        inMax: 1,
        outMin: 0,
        outMax: 60,
    }));

    if (minutes < 0) {
        minutes = 0;
    }
    if (seconds < 0) {
        seconds = 0;
    }

    const timerEl = document.getElementById('timer');
    timerEl.innerText = `${twoDigits(minutes)}:${twoDigits(seconds)}`;

    if (minutes === 0 && seconds === 0) {
        clearInterval(timer);
        if (testType === 'writing') {
            document.querySelectorAll('.textarea').forEach(item => {
                item.contentEditable = 'false';
                item.classList.add('disabled');
            });
        } else {
            document.querySelectorAll('.question-item input').forEach(item => {
                item.disabled = true;
            });
        }
    }
}

function setPageTitle() {
    const titleEl = document.getElementById('title');
    titleEl.innerText = `${testType.substring(0, 1).toUpperCase()}${testType.substring(1)}`;
}

function init() {
    const hash = window.location.hash.replace('#', '');
    if (acceptedTestTypes.includes(hash)) {
        testType = hash;
    }
    if (testType === 'writing') {
        createTextAreas();
    } else {
        createFields();
    }
    duration = durationTable[testType];
    document.getElementById('test-type-select').value = testType;
    tick();
    setPageTitle();
}

function start() {
    startTime = Date.now();
    tick();
    clearInterval(timer);
    timer = setInterval(tick, 1000);
    document.getElementById('start-button').classList.add('hidden');
    document.getElementById('stop-button').classList.remove('hidden');
    started = true;
}

function stop() {
    clearInterval(timer);
    startTime = Date.now();
    tick();
    document.getElementById('start-button').classList.remove('hidden');
    document.getElementById('stop-button').classList.add('hidden');
    started = false;
}

function reset() {
    counter = 0;
    score = 0;
    stop();

    if (testType === 'writing') {
        createTextAreas();
    } else {
        createFields();
    }
}

// utils
function remapValue(props) {
    if (props.value < props.inMin) {
        return props.outMin;
    }
    if (props.value > props.inMax) {
        return props.outMax;
    }

    return (
        ((props.value - props.inMin) * (props.outMax - props.outMin)) / (props.inMax - props.inMin)
    ) + props.outMin;
}

function twoDigits(value) {
    if (value >= 10) {
        return value.toString();
    }
    return `0${value}`;
}
//


init();
