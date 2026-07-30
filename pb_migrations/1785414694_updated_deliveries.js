/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2444735992")

  // update collection data
  unmarshal({
    "createRule": "(@request.auth.role = \"admin\" || (@request.auth.role = \"estudiante\" && (@request.auth.id != \"\" && @collection.enrollments.cohort ?= @request.body.assignment.sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= \"active\") && @request.body.student = @request.auth.id))",
    "deleteRule": "@request.auth.role = \"admin\"",
    "listRule": "((@request.auth.role = \"admin\" || (@request.auth.role = \"docente\" && @collection.enrollments.cohort ?= assignment.sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= \"teacher\" && @collection.enrollments.status ?= \"active\")) || ((@request.auth.id != \"\" && @collection.enrollments.cohort ?= assignment.sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= \"active\") && student = @request.auth.id))",
    "updateRule": "(@request.auth.role = \"admin\" || (@request.auth.role = \"estudiante\" && (@request.auth.id != \"\" && @collection.enrollments.cohort ?= assignment.sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= \"active\") && student = @request.auth.id && @request.body.assignment:changed = false && @request.body.student:changed = false))",
    "viewRule": "((@request.auth.role = \"admin\" || (@request.auth.role = \"docente\" && @collection.enrollments.cohort ?= assignment.sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= \"teacher\" && @collection.enrollments.status ?= \"active\")) || ((@request.auth.id != \"\" && @collection.enrollments.cohort ?= assignment.sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= \"active\") && student = @request.auth.id))"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2444735992")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
