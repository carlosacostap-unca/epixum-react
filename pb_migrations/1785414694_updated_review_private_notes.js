/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_172606212")

  // update collection data
  unmarshal({
    "createRule": "(@request.auth.role = \"admin\" || (@request.auth.role = \"docente\" && @collection.enrollments.cohort ?= @request.body.review.sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= \"teacher\" && @collection.enrollments.status ?= \"active\"))",
    "deleteRule": "(@request.auth.role = \"admin\" || (@request.auth.role = \"docente\" && @collection.enrollments.cohort ?= review.sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= \"teacher\" && @collection.enrollments.status ?= \"active\"))",
    "listRule": "(@request.auth.role = \"admin\" || (@request.auth.role = \"docente\" && @collection.enrollments.cohort ?= review.sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= \"teacher\" && @collection.enrollments.status ?= \"active\"))",
    "updateRule": "(@request.auth.role = \"admin\" || (@request.auth.role = \"docente\" && @collection.enrollments.cohort ?= review.sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= \"teacher\" && @collection.enrollments.status ?= \"active\"))",
    "viewRule": "(@request.auth.role = \"admin\" || (@request.auth.role = \"docente\" && @collection.enrollments.cohort ?= review.sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= \"teacher\" && @collection.enrollments.status ?= \"active\"))"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_172606212")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"admin\"",
    "deleteRule": "@request.auth.role = \"admin\"",
    "listRule": "@request.auth.role = \"admin\"",
    "updateRule": "@request.auth.role = \"admin\"",
    "viewRule": "@request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
})
