/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1709638221")

  // add field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1357820144",
    "help": "",
    "hidden": false,
    "id": "relation3552100715",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "cohort",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1709638221")

  // remove field
  collection.fields.removeById("relation3552100715")

  return app.save(collection)
})
