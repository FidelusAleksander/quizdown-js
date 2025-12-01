/**
 * Pure JavaScript/DOM renderer for quizdown.
 * Replaces Svelte components with vanilla JavaScript DOM manipulation.
 */

import { Quiz, BaseQuestion, Answer } from './quiz.js';
import { initLocale, t } from './i18n.js';
import type { Writable } from './store.js';

// Import font awesome icons
import { library, config, icon } from '@fortawesome/fontawesome-svg-core';
import {
    faArrowLeft,
    faArrowRight,
    faRedo,
    faCheckDouble,
    faCircleNotch,
} from '@fortawesome/free-solid-svg-icons';
import { faLightbulb } from '@fortawesome/free-regular-svg-icons';

// Register icons
function registerIcons(): void {
    config.autoAddCss = false;
    library.add(
        faArrowLeft,
        faArrowRight,
        faRedo,
        faLightbulb,
        faCheckDouble,
        faCircleNotch
    );
}

// Create an icon HTML
function createIcon(name: string, options: { solid?: boolean; size?: string; spin?: boolean } = {}): string {
    const prefix = options.solid !== false ? 'fas' : 'far';
    const classes: string[] = [];
    if (options.size) classes.push(`fa-${options.size}`);
    if (options.spin) classes.push('fa-spin');
    
    const iconObj = { prefix, iconName: name } as any;
    const result = icon(iconObj, { classes });
    return result?.html[0] || '';
}

// CSS styles for the quiz - including FontAwesome core styles
const styles = `
/* FontAwesome core styles */
svg:not(:root).svg-inline--fa {
  overflow: visible;
}

.svg-inline--fa {
  display: inline-block;
  font-size: inherit;
  height: 1em;
  overflow: visible;
  vertical-align: -0.125em;
}

.svg-inline--fa.fa-lg {
  vertical-align: -0.225em;
}

.svg-inline--fa.fa-w-1 {
  width: 0.0625em;
}

.svg-inline--fa.fa-w-2 {
  width: 0.125em;
}

.svg-inline--fa.fa-w-3 {
  width: 0.1875em;
}

.svg-inline--fa.fa-w-4 {
  width: 0.25em;
}

.svg-inline--fa.fa-w-5 {
  width: 0.3125em;
}

.svg-inline--fa.fa-w-6 {
  width: 0.375em;
}

.svg-inline--fa.fa-w-7 {
  width: 0.4375em;
}

.svg-inline--fa.fa-w-8 {
  width: 0.5em;
}

.svg-inline--fa.fa-w-9 {
  width: 0.5625em;
}

.svg-inline--fa.fa-w-10 {
  width: 0.625em;
}

.svg-inline--fa.fa-w-11 {
  width: 0.6875em;
}

.svg-inline--fa.fa-w-12 {
  width: 0.75em;
}

.svg-inline--fa.fa-w-13 {
  width: 0.8125em;
}

.svg-inline--fa.fa-w-14 {
  width: 0.875em;
}

.svg-inline--fa.fa-w-15 {
  width: 0.9375em;
}

.svg-inline--fa.fa-w-16 {
  width: 1em;
}

.svg-inline--fa.fa-w-17 {
  width: 1.0625em;
}

.svg-inline--fa.fa-w-18 {
  width: 1.125em;
}

.svg-inline--fa.fa-w-19 {
  width: 1.1875em;
}

.svg-inline--fa.fa-w-20 {
  width: 1.25em;
}

.svg-inline--fa.fa-spin {
  animation: fa-spin 2s infinite linear;
}

.svg-inline--fa.fa-2x {
  font-size: 2em;
}

.svg-inline--fa.fa-lg {
  font-size: 1.33333em;
  line-height: 0.75em;
  vertical-align: -0.0667em;
}

@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

img {
    max-height: 400px;
    border-radius: 4px;
    max-width: 100%;
    height: auto;
}

code {
    padding: 0 0.4rem;
    font-size: 85%;
    color: #333;
    white-space: pre-wrap;
    border-radius: 4px;
    padding: 0.2em 0.4em;
    background-color: #f8f8f8;
    font-family: Consolas, Monaco, monospace;
}

a {
    color: var(--quizdown-color-primary);
}

.quizdown-content {
    padding: 1rem;
    max-width: 900px;
    margin: auto;
}

.card {
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
    border-radius: 0 0 4px 4px;
}

.progress {
    grid-area: auto;
    height: 0.4em;
    width: 100%;
    position: relative;
}

.progress .progress-slider {
    background-color: var(--quizdown-color-primary);
    height: 100%;
    display: block;
    transition: width 0.4s ease-out;
}

.container {
    padding: 2px 16px;
    display: grid;
    align-items: start;
    overflow: hidden;
}

fieldset {
    border: 0;
}

[type='checkbox'],
[type='radio'] {
    position: absolute;
    opacity: 0;
}

[type='radio'] + span {
    border-radius: 0.5em;
}

[type='checkbox'] + span {
    border-radius: 2px;
}

[type='checkbox'] + span,
[type='radio'] + span {
    transition-duration: 0.3s;
    background-color: var(--quizdown-color-secondary);
    color: var(--quizdown-color-text);
    display: block;
    padding: 0.5rem;
    margin: 5px;
    border: 3px solid transparent;
    cursor: pointer;
}

[type='checkbox']:hover + span,
[type='checkbox']:focus + span,
[type='radio']:hover + span,
[type='radio']:focus + span {
    filter: brightness(0.9);
}

[type='checkbox']:checked + span,
[type='radio']:checked + span {
    border: 3px solid var(--quizdown-color-primary);
}

.row {
    padding-top: 2em;
    display: flex;
}

.left {
    flex: 1;
    display: flex;
    justify-content: flex-start;
}

.center {
    display: flex;
    justify-content: center;
}

.right {
    flex: 1;
    display: flex;
    justify-content: flex-end;
}

button:disabled {
    background-color: white;
    filter: grayscale(100%);
    color: gray;
    cursor: initial;
    opacity: 50%;
}

button {
    background-color: white;
    color: var(--quizdown-color-text);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: 1px solid transparent;
    line-height: 1;
    text-align: center;
    transition: opacity 0.2s ease;
    text-decoration: none;
    display: inline-block;
    cursor: pointer;
    margin: 0.2rem;
    font-size: 1em;
}

button:hover:not(:checked):not(:active):not(:disabled) {
    filter: brightness(0.9);
}

.credits a {
    color: gray;
    text-decoration: none;
}

.credits a:hover {
    text-decoration: underline;
}

.credits {
    margin-top: 1rem;
    font-size: small;
    text-align: end;
    color: lightgray;
}

.hint {
    animation: fadeIn 0.4s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.loading {
    vertical-align: middle;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
}

/* Drag and drop list styles */
.dragdroplist {
    position: relative;
    padding: 0;
}

.list {
    cursor: grab;
    z-index: 5;
    display: flex;
    flex-direction: column;
}

.item {
    box-sizing: border-box;
    display: inline-flex;
    width: 100%;
    margin-bottom: 0.5em;
    border-radius: 2px;
    user-select: none;
    margin: 5px;
    padding: 0;
    background-color: var(--quizdown-color-secondary);
    border: 3px solid transparent;
    color: var(--quizdown-color-text);
}

.item:last-child {
    margin-bottom: 0;
}

.item:not(#grabbed):not(#ghost) {
    z-index: 10;
}

.item > * {
    margin: auto auto auto 0;
}

.buttons {
    width: 32px;
    min-width: 32px;
    margin: auto 0;
    display: flex;
    flex-direction: column;
}

.buttons button {
    cursor: pointer;
    width: 18px;
    height: 18px;
    margin: 0 auto;
    padding: 0;
    border: 1px solid rgba(0, 0, 0, 0);
    background-color: inherit;
}

.buttons button:focus {
    border: 1px solid black;
}

.delete {
    width: 32px;
}

#grabbed {
    opacity: 0;
}

#ghost {
    pointer-events: none;
    z-index: -5;
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
    border: 3px solid var(--quizdown-color-primary);
    background-color: var(--quizdown-color-secondary);
}

#ghost * {
    pointer-events: none;
}

#ghost.haunting {
    z-index: 20;
    opacity: 1;
}

/* Results view styles */
.results ol {
    padding-left: 0;
    display: inline-block;
}

.results .top-list-item {
    margin-bottom: 0.2rem;
    list-style-type: none;
    list-style: none;
}

.results .top-list-item:hover {
    cursor: pointer;
    background-color: var(--quizdown-color-secondary);
}

.results .top-list-item:hover .list-question {
    text-decoration: underline;
}

.results .list-comment {
    margin-left: 2em;
    list-style-type: initial;
}

.animated {
    animation: fadeIn 0.4s ease-in;
}
`;

export class QuizRenderer {
    private quiz: Quiz;
    private root: ShadowRoot;
    private container: HTMLElement;
    private unsubscribers: (() => void)[] = [];
    private minHeight = 150;

    constructor(quiz: Quiz, root: ShadowRoot) {
        this.quiz = quiz;
        this.root = root;
        registerIcons();
        initLocale(quiz.config.locale);
    }

    render(): void {
        // Add styles
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        this.root.appendChild(styleElement);

        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'quizdown-content';
        this.container.style.minHeight = `${this.minHeight}px`;
        this.container.style.setProperty('--quizdown-color-primary', this.quiz.config.primaryColor);
        this.container.style.setProperty('--quizdown-color-secondary', this.quiz.config.secondaryColor);
        this.container.style.setProperty('--quizdown-color-text', this.quiz.config.textColor);
        this.root.appendChild(this.container);

        this.update();

        // Subscribe to changes
        this.unsubscribers.push(
            this.quiz.index.subscribe(() => this.update()),
            this.quiz.onResults.subscribe(() => this.update()),
            this.quiz.active.subscribe(() => this.updateQuestion())
        );
    }

    private update(): void {
        this.container.innerHTML = '';
        
        const card = this.createCard();
        this.container.appendChild(card);
    }

    private createCard(): HTMLElement {
        const card = document.createElement('div');
        card.className = 'card';

        // Progress bar
        const progressBar = this.createProgressBar();
        card.appendChild(progressBar);

        // Container for content
        const containerDiv = document.createElement('div');
        containerDiv.className = 'container';

        // Animated content wrapper
        const animatedDiv = document.createElement('div');
        animatedDiv.className = 'animated';

        if (this.quiz.onResults.get()) {
            animatedDiv.appendChild(this.createResultsView());
        } else {
            animatedDiv.appendChild(this.createQuestionView());
            animatedDiv.appendChild(this.createHint());
        }

        containerDiv.appendChild(animatedDiv);
        containerDiv.appendChild(this.createButtonRow());
        containerDiv.appendChild(this.createCredits());

        card.appendChild(containerDiv);
        return card;
    }

    private createProgressBar(): HTMLElement {
        const progress = document.createElement('div');
        progress.className = 'progress';

        const slider = document.createElement('div');
        slider.className = 'progress-slider';
        
        const index = this.quiz.index.get();
        const max = this.quiz.questions.length - 1;
        const progressPercent = ((Math.min(max, index) + 0.5) / (max + 0.5)) * 100;
        slider.style.width = `${progressPercent}%`;

        progress.appendChild(slider);
        return progress;
    }

    private createQuestionView(): HTMLElement {
        const question = this.quiz.active.get();
        const questionIndex = this.quiz.index.get();

        const div = document.createElement('div');

        // Question header
        const h3 = document.createElement('h3');
        h3.innerHTML = `${t('questionLetter')}${questionIndex + 1}: ${question.text}`;
        div.appendChild(h3);

        // Explanation
        if (question.explanation) {
            const p = document.createElement('p');
            p.innerHTML = question.explanation;
            div.appendChild(p);
        }

        // Question type specific view
        if (question.questionType === 'Sequence') {
            div.appendChild(this.createSequenceView(question));
        } else {
            div.appendChild(this.createChoiceView(question));
        }

        return div;
    }

    private createChoiceView(question: BaseQuestion): HTMLElement {
        const fieldset = document.createElement('fieldset');
        const isMultipleChoice = question.questionType === 'MultipleChoice';
        const inputType = isMultipleChoice ? 'checkbox' : 'radio';
        const inputName = `question-${this.quiz.index.get()}`;

        question.answers.forEach((answer, i) => {
            const label = document.createElement('label');
            
            const input = document.createElement('input');
            input.type = inputType;
            input.name = inputName;
            input.value = String(i);
            
            if (isMultipleChoice) {
                input.checked = question.selected.includes(i);
                input.addEventListener('change', () => {
                    if (input.checked) {
                        if (!question.selected.includes(i)) {
                            question.selected.push(i);
                        }
                    } else {
                        question.selected = question.selected.filter(idx => idx !== i);
                    }
                });
            } else {
                input.checked = question.selected[0] === i;
                input.addEventListener('change', () => {
                    if (input.checked) {
                        question.selected = [i];
                    }
                });
            }

            const span = document.createElement('span');
            span.innerHTML = answer.html;

            label.appendChild(input);
            label.appendChild(span);
            fieldset.appendChild(label);
        });

        return fieldset;
    }

    private createSequenceView(question: BaseQuestion): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = 'dragdroplist';

        // Ghost element for drag
        const ghost = document.createElement('div');
        ghost.id = 'ghost';
        ghost.className = 'item';
        ghost.innerHTML = '<p></p>';
        wrapper.appendChild(ghost);

        // List container
        const list = document.createElement('div');
        list.className = 'list';

        let grabbed: HTMLElement | null = null;
        let mouseY = 0;
        let offsetY = 0;
        let lastTarget: HTMLElement | null = null;

        const updateGhostPosition = () => {
            if (grabbed) {
                const layerY = ghost.parentElement?.getBoundingClientRect().y || 0;
                ghost.style.top = `${mouseY + offsetY - layerY}px`;
            }
        };

        const moveDatum = (from: number, to: number) => {
            const temp = question.answers[from];
            question.answers = [
                ...question.answers.slice(0, from),
                ...question.answers.slice(from + 1)
            ];
            question.answers = [
                ...question.answers.slice(0, to),
                temp,
                ...question.answers.slice(to)
            ];
            // Update selected to reflect new order
            question.selected = question.answers.map(a => a.id);
            this.renderSequenceItems(list, question, ghost, (g, m, o, l) => {
                grabbed = g;
                mouseY = m;
                offsetY = o;
                lastTarget = l;
            });
        };

        this.renderSequenceItems(list, question, ghost, (g, m, o, l) => {
            grabbed = g;
            mouseY = m;
            offsetY = o;
            lastTarget = l;
        });

        list.addEventListener('mousemove', (ev) => {
            ev.stopPropagation();
            if (grabbed) {
                mouseY = ev.clientY;
                updateGhostPosition();
            }
        });

        list.addEventListener('touchmove', (ev) => {
            ev.stopPropagation();
            if (grabbed && ev.touches[0]) {
                mouseY = ev.touches[0].clientY;
                updateGhostPosition();

                // Touch enter emulation
                const root = ghost.getRootNode() as Document | ShadowRoot;
                const target = root.elementFromPoint(ev.touches[0].clientX, ev.touches[0].clientY);
                if (target) {
                    const itemTarget = (target as HTMLElement).closest('.item') as HTMLElement;
                    if (itemTarget && itemTarget !== lastTarget && itemTarget !== grabbed) {
                        lastTarget = itemTarget;
                        const fromIdx = parseInt(grabbed.dataset.index || '0');
                        const toIdx = parseInt(itemTarget.dataset.index || '0');
                        if (fromIdx !== toIdx) {
                            moveDatum(fromIdx, toIdx);
                        }
                    }
                }
            }
        }, { passive: true });

        list.addEventListener('mouseup', (ev) => {
            ev.stopPropagation();
            if (grabbed) {
                grabbed.id = '';
                grabbed = null;
                ghost.className = 'item';
            }
        });

        list.addEventListener('mouseleave', (ev) => {
            ev.stopPropagation();
            if (grabbed) {
                grabbed.id = '';
                grabbed = null;
                ghost.className = 'item';
            }
        });

        list.addEventListener('touchend', (ev) => {
            ev.stopPropagation();
            if (grabbed) {
                grabbed.id = '';
                grabbed = null;
                ghost.className = 'item';
            }
        });

        wrapper.appendChild(list);

        // Initialize selected array
        question.selected = question.answers.map(a => a.id);

        return wrapper;
    }

    private renderSequenceItems(
        list: HTMLElement,
        question: BaseQuestion,
        ghost: HTMLElement,
        setDragState: (grabbed: HTMLElement | null, mouseY: number, offsetY: number, lastTarget: HTMLElement | null) => void
    ): void {
        list.innerHTML = '';

        question.answers.forEach((datum, i) => {
            const item = document.createElement('div');
            item.className = 'item';
            item.dataset.index = String(i);
            item.dataset.id = String(datum.id);

            // Up/Down buttons container
            const buttons = document.createElement('div');
            buttons.className = 'buttons';

            // Up button
            const upBtn = document.createElement('button');
            upBtn.className = 'up';
            upBtn.style.visibility = i > 0 ? '' : 'hidden';
            upBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16px" height="16px"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"></path></svg>';
            upBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (i > 0) {
                    const temp = question.answers[i];
                    question.answers[i] = question.answers[i - 1];
                    question.answers[i - 1] = temp;
                    question.selected = question.answers.map(a => a.id);
                    this.renderSequenceItems(list, question, ghost, setDragState);
                }
            });
            buttons.appendChild(upBtn);

            // Down button
            const downBtn = document.createElement('button');
            downBtn.className = 'down';
            downBtn.style.visibility = i < question.answers.length - 1 ? '' : 'hidden';
            downBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16px" height="16px"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"></path></svg>';
            downBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (i < question.answers.length - 1) {
                    const temp = question.answers[i];
                    question.answers[i] = question.answers[i + 1];
                    question.answers[i + 1] = temp;
                    question.selected = question.answers.map(a => a.id);
                    this.renderSequenceItems(list, question, ghost, setDragState);
                }
            });
            buttons.appendChild(downBtn);

            item.appendChild(buttons);

            // Content
            const content = document.createElement('div');
            content.className = 'content';
            content.innerHTML = datum.html || String(datum);
            item.appendChild(content);

            // Delete buttons placeholder (empty for non-removable items)
            const deleteButtons = document.createElement('div');
            deleteButtons.className = 'buttons delete';
            item.appendChild(deleteButtons);

            // Drag handlers
            const grab = (clientY: number) => {
                item.id = 'grabbed';
                ghost.innerHTML = item.innerHTML;
                const offsetY = item.getBoundingClientRect().y - clientY;
                setDragState(item, clientY, offsetY, null);
                ghost.className = 'item haunting';
                const layerY = ghost.parentElement?.getBoundingClientRect().y || 0;
                ghost.style.top = `${clientY + offsetY - layerY}px`;
            };

            item.addEventListener('mousedown', (ev) => {
                grab(ev.clientY);
            });

            item.addEventListener('touchstart', (ev) => {
                if (ev.touches[0]) {
                    grab(ev.touches[0].clientY);
                }
            }, { passive: true });

            item.addEventListener('mouseenter', (ev) => {
                ev.stopPropagation();
                const currentGrabbed = list.querySelector('#grabbed') as HTMLElement;
                if (currentGrabbed && item !== currentGrabbed) {
                    const fromIdx = parseInt(currentGrabbed.dataset.index || '0');
                    const toIdx = parseInt(item.dataset.index || '0');
                    if (fromIdx !== toIdx) {
                        const temp = question.answers[fromIdx];
                        question.answers = [
                            ...question.answers.slice(0, fromIdx),
                            ...question.answers.slice(fromIdx + 1)
                        ];
                        question.answers = [
                            ...question.answers.slice(0, toIdx),
                            temp,
                            ...question.answers.slice(toIdx)
                        ];
                        question.selected = question.answers.map(a => a.id);
                        this.renderSequenceItems(list, question, ghost, setDragState);
                    }
                }
            });

            list.appendChild(item);
        });
    }

    private createHint(): HTMLElement {
        const question = this.quiz.active.get();
        const div = document.createElement('div');
        
        const showHint = question.showHint.get();
        if (showHint && question.hint) {
            const p = document.createElement('p');
            p.className = 'hint';
            p.innerHTML = `💡 ${question.hint}`;
            div.appendChild(p);
        }

        return div;
    }

    private createResultsView(): HTMLElement {
        const div = document.createElement('div');
        div.className = 'results animated';

        const points = this.quiz.evaluate();
        const total = this.quiz.questions.length;

        // Title
        const h3 = document.createElement('h3');
        h3.textContent = t('resultsTitle');
        div.appendChild(h3);

        // Score
        const h1 = document.createElement('h1');
        h1.innerHTML = `${createIcon('check-double')} ${String(points).padStart(2, '0')}/${String(total).padStart(2, '0')}`;
        div.appendChild(h1);

        // Questions list
        const ol = document.createElement('ol');
        
        this.quiz.questions.forEach((question, i) => {
            const li = document.createElement('li');
            li.className = 'top-list-item';
            li.addEventListener('click', () => {
                if (this.quiz.config.enableRetry) {
                    this.quiz.jump(i);
                }
            });

            const span = document.createElement('span');
            span.className = 'list-question';
            const emoji = question.solved ? '✅' : '❌';
            span.innerHTML = `${emoji} ${question.text}`;
            li.appendChild(span);

            // Comments for selected answers
            const commentsOl = document.createElement('ol');
            question.selected.forEach(selected => {
                const answer = question.answers[selected];
                if (answer && answer.comment) {
                    const commentLi = document.createElement('li');
                    commentLi.className = 'list-comment';
                    commentLi.innerHTML = `<i>${answer.html}</i>: ${answer.comment}`;
                    commentsOl.appendChild(commentLi);
                }
            });
            if (commentsOl.children.length > 0) {
                li.appendChild(commentsOl);
            }

            ol.appendChild(li);
        });

        div.appendChild(ol);

        // Pass/Fail message
        if (this.quiz.config.passingGrade !== undefined) {
            const percentage = (points / total) * 100;
            const passed = percentage >= this.quiz.config.passingGrade;
            const h2 = document.createElement('h2');
            h2.textContent = passed ? this.quiz.config.customPassMsg : this.quiz.config.customFailMsg;
            div.appendChild(h2);
        }

        return div;
    }

    private createButtonRow(): HTMLElement {
        const row = document.createElement('div');
        row.className = 'row';

        const question = this.quiz.active.get();
        const onFirst = this.quiz.onFirst.get();
        const onLast = this.quiz.onLast.get();
        const onResults = this.quiz.onResults.get();
        const isEvaluated = this.quiz.isEvaluated.get();
        const allVisited = this.quiz.allVisited.get();

        // Left - Hint button
        const left = document.createElement('div');
        left.className = 'left';
        
        const hintBtn = this.createButton(
            t('hint'),
            createIcon('lightbulb', { solid: false }),
            () => question.enableHint(),
            !question.hint || question.showHint.get() || onResults
        );
        left.appendChild(hintBtn);
        row.appendChild(left);

        // Center - Navigation buttons
        const center = document.createElement('div');
        center.className = 'center';

        const prevBtn = this.createButton(
            t('previous'),
            createIcon('arrow-left', { size: 'lg' }),
            () => this.quiz.previous(),
            onFirst || onResults || isEvaluated
        );
        center.appendChild(prevBtn);

        const nextBtn = this.createButton(
            t('next'),
            createIcon('arrow-right', { size: 'lg' }),
            () => this.quiz.next(),
            onLast || onResults || isEvaluated
        );
        center.appendChild(nextBtn);

        if (onLast || allVisited) {
            const evalBtn = this.createButton(
                t('evaluate'),
                createIcon('check-double', { size: 'lg' }),
                () => this.quiz.jump(this.quiz.questions.length),
                onResults
            );
            center.appendChild(evalBtn);
        }

        row.appendChild(center);

        // Right - Reset button
        const right = document.createElement('div');
        right.className = 'right';
        
        if (this.quiz.config.enableRetry) {
            const resetBtn = this.createButton(
                t('reset'),
                createIcon('redo'),
                () => this.quiz.reset()
            );
            right.appendChild(resetBtn);
        }
        row.appendChild(right);

        return row;
    }

    private createButton(title: string, iconHtml: string, onClick: () => void, disabled = false): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.title = title;
        btn.disabled = disabled;
        btn.innerHTML = iconHtml;
        btn.addEventListener('click', onClick);
        return btn;
    }

    private createCredits(): HTMLElement {
        const div = document.createElement('div');
        div.className = 'credits';
        div.innerHTML = '<a href="https://github.com/bonartm/quizdown-js">quizdown</a>';
        return div;
    }

    private updateQuestion(): void {
        // Triggered when the active question changes
        // Full re-render handles this
    }

    destroy(): void {
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
    }
}
