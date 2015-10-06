import chai, { expect } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { initTestlet, given, when, then, waitUntil, mockAction, spy, spyOn } from 'fluxlet-testlet'

import { initialState, loadTodos } from 'js/app.js'

chai.use(sinonChai)

describe('action', () => {

  beforeEach(() => {
    initTestlet()

    given
      .fluxlet("todomvc")
      .state(initialState)
  })

  describe('loadTodos', () => {

    beforeEach(() => {
      given
        .actions({ loadTodos })
    })

    it("sets persist.loading to true", () => {
      when.loadTodos()

      then((state, prev) => {
        expect(prev.persist.loading).to.be.false
        expect(state.persist.loading).to.be.true
      })
    })

    it("sets persist.storageKey to the given key", () => {
      when.loadTodos('somekey')

      then((state, prev) => {
        expect(prev.persist.storageKey).to.be.null
        expect(state.persist.storageKey).to.equal('somekey')
      })
    })

  })

})
