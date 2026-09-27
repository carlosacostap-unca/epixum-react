/// <reference path="../pb_data/types.d.ts" />

const previousReviewUpdateRule = '((@request.auth.role = "admin" || (@request.auth.role = "docente" && @collection.enrollments.cohort ?= sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= "teacher" && @collection.enrollments.status ?= "active")) || (@request.auth.role = "estudiante" && (@request.auth.id != "" && @collection.enrollments.cohort ?= sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= "active") && @request.body.sprint:changed = false && @request.body.teacher:changed = false && @request.body.startTime:changed = false && @request.body.endTime:changed = false && @request.body.public_note:changed = false && @request.body.status:changed = false && @request.body.meetingLink:changed = false && @request.body.roomNumber:changed = false && @request.body.studentCancellationLocked:changed = false && studentCancellationLocked = false && ((student = "" && @request.body.student = @request.auth.id && (@request.body.bookingOrdinal = "first" || @request.body.bookingOrdinal = "second")) || (student = @request.auth.id && @request.body.student = "" && @request.body.bookingOrdinal = ""))))'
const upcomingCancellationReviewUpdateRule = '((@request.auth.role = "admin" || (@request.auth.role = "docente" && @collection.enrollments.cohort ?= sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= "teacher" && @collection.enrollments.status ?= "active")) || (@request.auth.role = "estudiante" && (@request.auth.id != "" && @collection.enrollments.cohort ?= sprint.cohort && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= "active") && @request.body.sprint:changed = false && @request.body.teacher:changed = false && @request.body.startTime:changed = false && @request.body.endTime:changed = false && @request.body.public_note:changed = false && @request.body.status:changed = false && @request.body.meetingLink:changed = false && @request.body.roomNumber:changed = false && @request.body.studentCancellationLocked:changed = false && studentCancellationLocked = false && ((student = "" && @request.body.student = @request.auth.id && (@request.body.bookingOrdinal = "first" || @request.body.bookingOrdinal = "second")) || (startTime > @now && student = @request.auth.id && @request.body.student = "" && @request.body.bookingOrdinal = ""))))'

migrate((app) => {
  const reviews = app.findCollectionByNameOrId("reviews")
  reviews.updateRule = upcomingCancellationReviewUpdateRule
  return app.save(reviews)
}, (app) => {
  const reviews = app.findCollectionByNameOrId("reviews")
  reviews.updateRule = previousReviewUpdateRule
  return app.save(reviews)
})
