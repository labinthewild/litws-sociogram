/*************************************************************
 * Main code, responsible for configuring the steps and their
 * actions.
 *
 * Author: LITW Team.
 *
 * © Copyright 2017-2024 LabintheWild.
 * For questions about this file and permission to use
 * the code, contact us at tech@labinthewild.org
 *************************************************************/

// load webpack modules
window.LITW = window.LITW || {}
window.$ = require("jquery");
window.jQuery = window.$;
require("../js/jquery.i18n");
require("../js/jquery.i18n.messagestore");
require("jquery-ui-bundle");
let Handlebars = require("handlebars");
window.$.alpaca = require("alpaca");
window.bootstrap = require("bootstrap");
window._ = require("lodash");

import * as litw_engine from "../js/litw/litw.engine.0.1.0";
LITW.engine = litw_engine;

//LOAD THE HTML FOR STUDY PAGES
import progressHTML from "../templates/progress.html";
Handlebars.registerPartial('prog', Handlebars.compile(progressHTML));
import introHTML from "./pages/introduction.html";
import irb_LITW_HTML from "../templates/irb2-litw.html";
import demographicsHTML from "../templates/demographics.html";
import sociogramHTML from "./pages/sociogram.html";
import loadingHTML from "../templates/loading.html";
import resultsHTML from "./pages/results.html";
import resultsFooterHTML from "../templates/results-footer.html";
import commentsHTML from "../templates/comments.html";

let introTemplate = Handlebars.compile(introHTML);
let irbLITWTemplate = Handlebars.compile(irb_LITW_HTML);
let demographicsTemplate = Handlebars.compile(demographicsHTML);
let sociogramTemplate = Handlebars.compile(sociogramHTML);
let loadingTemplate = Handlebars.compile(loadingHTML);
let resultsTemplate = Handlebars.compile(resultsHTML);
let resultsFooterTemplate = Handlebars.compile(resultsFooterHTML);
let commentsTemplate = Handlebars.compile(commentsHTML);

import * as socio_utils from "./js/sociogram.mjs";
import * as socio_results from "./js/sociogram-results.mjs";

module.exports = (function(exports) {
	const study_times= {
			SHORT: 5,
			MEDIUM: 10,
			LONG: 15,
		};
	let timeline = [];
	let config = {
		study_id: "1783e5ff-3c49-458d-8806-196bbfac52a3",
		languages: {
			'default': 'en',
			'en': './i18n/en.json?v=1.0'
		},
		sociogram_minimum_people: 5,
		sociogram: {
			TEST: 'DATA',
			canvas_size: {},
			people: [
				{startX: 281.5, startY: 152.234375, radius: 75, label: 'self'},
				{startX: 639.5, startY: 354.234375, radius: 67.5, label: 'family'},
				{startX: 278.5, startY: 431.234375, radius: 37.5, label: 'friend'},
				{startX: 278.5, startY: 431.234375, radius: 27.5, label: 'acquaintance'}
			]
		},
		preLoad: ["../img/btn-next.png","../img/btn-next-active.png","../img/ajax-loader.gif"],
		slides: {
			INTRODUCTION: {
				name: "introduction",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: introTemplate,
				display_element_id: "intro",
				display_next_button: false,
			},
			INFORMED_CONSENT: {
				name: "informed_consent",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: irbLITWTemplate,
				template_data: {
					time: study_times.SHORT
				},
				display_element_id: "irb",
				display_next_button: false,
			},
			DEMOGRAPHICS: {
				name: "demographics",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: demographicsTemplate,
				template_data: {
					local_data_id: 'LITW_DEMOGRAPHICS'
				},
				display_element_id: "demographics",
				display_next_button: false,
				finish: function(){
					let dem_data = $('#demographicsForm').alpaca().getValue();
					LITW.data.addToLocal(this.template_data.local_data_id, dem_data);
					LITW.data.submitDemographics(dem_data);
				}
			},
			SOCIOGRAM: {
				name: "sociogram",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: sociogramTemplate,
				display_element_id: "sociogram",
				display_next_button: false
			},
			COMMENTS: {
				name: "comments",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: commentsTemplate,
				display_element_id: "comments",
				display_next_button: true,
				finish: function(){
					let comments = $('#commentsForm').alpaca().getValue();
					if (Object.keys(comments).length > 0) {
						LITW.data.submitComments({
							comments: comments
						});
					}
				}
			},
			RESULTS: {
				name: "results",
				display_next_button: false,
				type: LITW.engine.SLIDE_TYPE.CALL_FUNCTION,
				call_fn: function(){
					calculateResults();
				}
			}
		}
	};

	function configureTimeline() {
		timeline.push(config.slides.INTRODUCTION);
		timeline.push(config.slides.INFORMED_CONSENT);
		timeline.push(config.slides.DEMOGRAPHICS);
		timeline.push(config.slides.SOCIOGRAM);
		timeline.push(config.slides.COMMENTS);
		timeline.push(config.slides.RESULTS);
		return timeline;
	}

	function saveSociogramResults() {
		config.sociogram = socio_utils.sociogram_data();
		LITW.data.submitStudyData({
			sociogram: config.sociogram
		});
	}

	function calculateResults() {
		socio_utils.sociogram_clean_up();
		let results_data = {}
		let accumulator = 0;
		for (let person of config.sociogram.people) {
			//TODO: need to get this value from the library!!!!
			if(person.label === 'self') {
				results_data.self = Math.round(person.radius)
			} else {
				accumulator += person.radius
			}
		}
		results_data.others = Math.round(accumulator/(config.sociogram.people.length-1));
		results_data.result_msg = results_data.self > results_data.others ?
			$.i18n('study-socio-results-independent') : $.i18n('study-socio-results-interdependent');
		showResults(results_data, true);
	}

	function showResults(results = {}, showFooter = false) {
		let results_div = $("#results");
		let recom_studies = [];
		LITW.engage.getStudiesRecommendation(config.study_id, (studies) => {recom_studies = studies});

		if('PID' in LITW.data.getURLparams) {
			//REASON: Default behavior for returning a unique PID when collecting data from other platforms
			results.code = LITW.data.getParticipantId();
		}

		results_div.html(
			resultsTemplate({
				data: results
			}));
		if(showFooter) {
			$("#results-footer").html(resultsFooterTemplate(
				{
					share_url: window.location.href,
					share_title: $.i18n('litw-irb-header'),
					share_text: $.i18n('litw-template-title'),
					more_litw_studies: recom_studies
				}
			));
		}
		results_div.i18n();
		LITW.utils.showSlide("results");
	}

	function bootstrap() {
		let good_config = LITW.engine.configure_study(config.preLoad, config.languages,
			configureTimeline(), config.study_id);
		if (good_config){
			LITW.engine.start_study();
		} else {
			console.error("Study configuration error!");
			//TODO fail nicely, maybe a page with useful info to send to the tech team?
		}
	}



	// when the page is loaded, start the study!
	$(document).ready(function() {
		bootstrap();
	});

	exports.study = {};
	exports.study.params = config;
	exports.study.sociogram = socio_utils.sociogram;
	exports.study.sociogram_status = socio_utils.sociogram_data;
	exports.study.sociogram_save = saveSociogramResults;
	exports.study.sociogram_results = socio_results.setup;
	exports.study.sociogram_results_draw = socio_results.drawBubbles;

})( window.LITW = window.LITW || {} );


