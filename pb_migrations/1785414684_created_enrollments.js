/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.role = \"admin\" || (@request.auth.role = \"docente\" && @request.body.role = \"student\" && @request.body.status = \"active\" && @request.body.user.role = \"estudiante\" && @collection.enrollments:manager.cohort ?= @request.body.cohort && @collection.enrollments:manager.user ?= @request.auth.id && @collection.enrollments:manager.role ?= \"teacher\" && @collection.enrollments:manager.status ?= \"active\")",
    "deleteRule": "@request.auth.role = \"admin\"",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_1357820144",
        "help": "",
        "hidden": false,
        "id": "relation3552100715",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "cohort",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "help": "",
        "hidden": false,
        "id": "relation2375276105",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "user",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "help": "",
        "hidden": false,
        "id": "select1466534506",
        "maxSelect": 1,
        "name": "role",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "student",
          "teacher"
        ]
      },
      {
        "help": "",
        "hidden": false,
        "id": "select2063623452",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "active",
          "inactive"
        ]
      }
    ],
    "id": "pbc_1009377862",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_enrollments_cohort_user` ON `enrollments` (`cohort`, `user`)"
    ],
    "listRule": "@request.auth.role = \"admin\" || user = @request.auth.id || (@request.auth.role = \"docente\" && @collection.enrollments:manager.cohort ?= cohort && @collection.enrollments:manager.user ?= @request.auth.id && @collection.enrollments:manager.role ?= \"teacher\" && @collection.enrollments:manager.status ?= \"active\")",
    "name": "enrollments",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = \"admin\" || (@request.auth.role = \"docente\" && role = \"student\" && user.role = \"estudiante\" && @request.body.cohort:changed = false && @request.body.user:changed = false && @request.body.role:changed = false && @collection.enrollments:manager.cohort ?= cohort && @collection.enrollments:manager.user ?= @request.auth.id && @collection.enrollments:manager.role ?= \"teacher\" && @collection.enrollments:manager.status ?= \"active\")",
    "viewRule": "@request.auth.role = \"admin\" || user = @request.auth.id || (@request.auth.role = \"docente\" && @collection.enrollments:manager.cohort ?= cohort && @collection.enrollments:manager.user ?= @request.auth.id && @collection.enrollments:manager.role ?= \"teacher\" && @collection.enrollments:manager.status ?= \"active\")"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1009377862");

  return app.delete(collection);
})
