import $ from "jquery"
import fluxlet from "fluxlet"
import { update } from "fluxlet-immutable/update"
import { freeze, deepFreeze } from "fluxlet-immutable/freeze"
import { chain } from "fluxlet-immutable/chain"
import { render, whenNotRendering, preserveFocusAndSelection } from "./render-utils"

// ## Fluxlet construction

export function setup() {
  console.log("Setup fluxlet")

  fluxlet("todomvc")
    .logging({
        register: true,
        dispatch: true,
        call: true,
        args: false,
        state: true,
        timing: false
    })
    .state(deepFreeze(initialState))
    .actions({
      route,
      setNewTodo,
      addTodo,
      editTodo,
      setEditTodo,
      saveTodo,
      todoDone,
      deleteTodo,
      clearCompleted,
      toggleAll
    })
    .calculations({
      countTodos
    })
    .calculations({
      renderTodoListHTML,
      renderTodoCountHTML
    })
    .sideEffects({
      toggleMain,
      renderTodoListToDOM,
      renderTodoCountToDOM,
      renderNewTodoInput,
      toggleClearCompleted,
      updateToggleAll,
      selectFilter
    })
    .sideEffects({ focusEdit })
    .init(bindings)
}

// ## State

export const initialState = {
  model: {
    todos: [],
    newTodo: "",
    editTodo: {
      index: null,
      text: null
    },
    filter: "/"
  },
  count: {
    total: 0,
    done: 0,
    remaining: 0
  },
  view: {
    todoCount: "",
    todoList: ""
  }
}

// ## Actions
// (...args) -> (state) -> state

export function route(hash) {
  return update("model.filter", hash.replace(/^#?/, '') || '/')
}

export function setNewTodo(value) {
  return update("model.newTodo", value)
}

export function addTodo() {
  return chain(
    update("model.todos", (todos, {model}) => {
      const text = model.newTodo.trim()
      return text ? todos.concat({ text, done: false }) : todos
    }),
    update("model.newTodo", "")
  )
}

export function editTodo(index) {
  return chain(
    update("model.editTodo.index", index),
    update("model.editTodo.text", (x, {model}) => typeof index === 'number' ? model.todos[index].text : null)
  )
}

export function setEditTodo(value) {
  return update("model.editTodo.text", value)
}

export function saveTodo() {
  return state => {
    const text = state.model.editTodo.text.trim()
    const index = state.model.editTodo.index
    return chain(
      text ? update(["model", "todos", index, "text"], text) : deleteTodo(index),
      editTodo(null)
    )(state)
  }
}

export function todoDone(index, done) {
  return update(["model", "todos", index, "done"], done)
}

export function deleteTodo(index) {
  return update("model.todos", (todos) => todos.filter((todo, i) => index !== i))
}

export function clearCompleted() {
  return update("model.todos", (todos) => todos.filter(({done}) => !done))
}

export function toggleAll(done) {
  return update("model.todos", (todos) => todos.map(update("done", done)))
}

// ## Predicates
// For use in when clauses of calculations and side-effects

// ### Simple predicate functions
// (state, prev) -> boolean

const hasTodos = (state) => state.model.todos.length
const todosChanged = (state, prev) => state.model.todos !== prev.model.todos
const editStarted = (state, prev) => state.model.editTodo.index != null && prev.model.editTodo.index == null
const editIndexChanged = (state, prev) => state.model.editTodo.index !== prev.model.editTodo.index
const filterChanged = (state, prev) => state.model.filter !== prev.model.filter
const firstTodoAdded = (state, prev) => state.model.todos.length && !prev.model.todos.length
const lastTodoRemoved = (state, prev) => !state.model.todos.length && prev.model.todos.length

// ### Predicate constructor functions
// (?) -> (state, prev) -> boolean

const anyOf = (...whens) => (state, prev) => whens.some(when => when(state,prev))
const countChanged = (prop) => (state, prev) => state.count[prop] !== prev.count[prop]
const viewUpdated = (prop) => (state, prev) => state.view[prop] !== prev.view[prop]

// ## Calculations
// (state, prev) -> state

export const countTodos = {
  when: todosChanged,

  then: chain(
    update("count.total", (x, {model}) => model.todos.length),
    update("count.done", (x, {model}) => model.todos.filter(({done}) => done).length),
    update("count.remaining", (x, {count}) => count.total - count.done)
  )
}

export const renderTodoListHTML = {
  when: anyOf(hasTodos, todosChanged, editIndexChanged, filterChanged),

  then: update("view.todoList", (x, {model}) => model.todos.map(renderTodo(model)))
}

function renderTodo({filter, editTodo}) {
  return (todo, index) => {
    const hidden = (filter === '/active' && todo.done) || (filter === '/completed' && !todo.done);
    if (hidden) {
      return '';
    }

    const isEditing = editTodo.index === index
    const todoClass = [todo.done && 'completed', isEditing && 'editing'].filter(v => !!v).join(' ')
    const todoClassAttr = todoClass.length ? `class="${todoClass}"` : ''
    const checked = todo.done ? 'checked' : ''
    const input = isEditing ? `<input class="edit" value="${editTodo.text}" id="edit-todo-${index}">` : ''

    return `
      <li ${todoClassAttr} data-index="${index}">
        <div class="view">
          <input class="toggle" type="checkbox" ${checked}>
          <label>${todo.text}</label>
          <button class="destroy"></button>
        </div>
        ${input}
      </li>`
    }
}

export const renderTodoCountHTML = {
  requiresCalculation: ["countTodos"],

  when: anyOf(hasTodos, countChanged("remaining")),

  then: update("view.todoCount", (x, {count}) => {
    const item = count.remaining === 1 ? 'item' : 'items'
    return `<strong>${count.remaining}</strong> ${item} left`
  })
}

// ## Side Effects
// (state, prev, dispatchers) -> void

export const toggleMain = {
  requiresCalculation: ["countTodos"],

  when: anyOf(firstTodoAdded, lastTodoRemoved),

  then: render(({count}) => $(".main, .footer").toggleClass('hidden', !count.total))
}

export const renderTodoListToDOM = {
  requiresCalculation: ["renderTodoListHTML"],

  when: viewUpdated("todoList"),

  then: render(preserveFocusAndSelection(({view}) => $(".todo-list").html(view.todoList)))
}

export const renderTodoCountToDOM = {
  requiresCalculation: ["renderTodoCountHTML"],

  when: viewUpdated("todoCount"),

  then: render(({view}) => $(".todo-count").html(view.todoCount))
}

export const focusEdit = {
  requiresSideEffects: ["renderTodoListToDOM"],

  when: editStarted,

  then: render(() => $(".editing input:not(:focus)").focus())
}

export const renderNewTodoInput = {
  when: ({model}) => model.newTodo !== $(".new-todo").val(),

  then: render(({model}) => $(".new-todo").val(model.newTodo))
}

export const toggleClearCompleted = {
  requiresCalculation: ["countTodos"],

  when: anyOf(hasTodos, countChanged("done")),

  then: render(({count}) => $(".clear-completed").toggleClass('hidden', !count.done))
}

export const updateToggleAll = {
  requiresCalculation: ["countTodos"],

  when: anyOf(hasTodos, countChanged("total"), countChanged("done")),

  then: render(({count}) => $(".toggle-all").prop("checked", count.total === count.done))
}

export const selectFilter = {
  when: anyOf(hasTodos, filterChanged),

  then: render(({model}) => $(".filters > li > a").removeClass("selected").filter(`[href$="${model.filter}"]`).addClass("selected"))
}

// ## Event Bindings
// (dispatchers) -> void

const ENTER_KEY = 13;
const ESC_KEY = 27;

export function bindings(dispatch) {
  $(document)
    .on("input", ".new-todo", ({target}) => dispatch.setNewTodo(target.value))

    .on("keypress", ".new-todo", ({which}) => {
      which === ENTER_KEY && dispatch.addTodo()
    })

    .on("click", ".toggle", ({target}) => dispatch.todoDone(todoIndex(target), target.checked))

    .on("click", ".destroy", ({target}) => dispatch.deleteTodo(todoIndex(target)))

    .on("dblclick", ".todo-list li", ({target}) => dispatch.editTodo(todoIndex(target)))

    .on("blur", ".edit", whenNotRendering(() => dispatch.saveTodo()))

    .on("input", ".edit", ({target}) => dispatch.setEditTodo(target.value))

    .on("keyup", ".edit", ({which}) => {
      if (which === ENTER_KEY) {
        dispatch.saveTodo()
      } else if (which === ESC_KEY) {
        dispatch.editTodo(null)
      }
    })

    .on("click", ".clear-completed", () => dispatch.clearCompleted())

    .on("click", ".toggle-all", ({target}) => dispatch.toggleAll(target.checked))

    .ready(() => dispatch.route(location.hash))

  $(window)
    .on("hashchange", () => dispatch.route(location.hash))
}

// ## Utilities

function todoIndex(target) {
  return +$(event.target).closest("[data-index]").data("index")
}

function logCall(msg, fn) {
  return function(...args) {
    console.log(msg, this, args)
    return fn.call(this, ...args)
  }
}
