/*global angular*/
(function () {
    "use strict";

    var app = angular.module('myApp', ['ng-admin']);

    app.controller('main', function ($scope, $rootScope, $location) {
        $rootScope.$on('$stateChangeSuccess', function () {
            $scope.displayBanner = $location.$$path === '/dashboard';
        });
    });

    app.config(function (NgAdminConfigurationProvider, RestangularProvider) {
        var nga = NgAdminConfigurationProvider;

        function truncate(value) {
            if (!value) {
                return '';
            }

            return value.length > 50 ? value.substr(0, 50) + '...' : value;
        }

        // use the custom query parameters function to format the API request correctly
        RestangularProvider.addFullRequestInterceptor(function(element, operation, what, url, headers, params) {
            if (operation == "getList") {
                // custom pagination params
                params._start = (params._page - 1) * params._perPage;
                params._end = params._page * params._perPage;
                delete params._page;
                delete params._perPage;
                // custom sort params
                if (params._sortField) {
                    params._sort = params._sortField;
                    delete params._sortField;
                }
                // custom filters
                if (params._filters) {
                    for (var filter in params._filters) {
                        params[filter] = params._filters[filter];
                    }
                    delete params._filters;
                }
            }
            return { params: params };
        });

        var admin = nga.application('Rest API Admin') // application main title
            .baseApiUrl('http://localhost:8000/'); // main API endpoint

        // define all entities at the top to allow references between them
        var question = nga.entity('questions')
                          .identifier(nga.field('uuid')); // the API endpoint for posts will be http://localhost:3000/posts/:id
        // set the application entities
        admin
            .addEntity(question)

        // customize entities and views

        question.menuView()
            .icon('<span class="glyphicon glyphicon-file"></span>'); // customize the entity menu icon

        question.dashboardView() // customize the dashboard panel for this entity
            .title('Recent questions')
            .order(1) // display the post panel first in the dashboard
            .perPage(5) // limit the panel to the 5 latest posts
            .fields([nga.field('title').isDetailLink(true).map(truncate)]); // fields() called with arguments add fields to the view

        question.listView()
            .title('All questions') // default title is "[Entity_name] list"
            .description('List of questions with infinite pagination') // description appears under the title
            .infinitePagination(true) // load pages as the user scrolls
            .fields([
                nga.field('title'), // the default list field type is "string", and displays as a string
            ])
            .listActions(['show', 'edit', 'delete']);

        question.creationView()
            .fields([
                nga.field('title') // the default edit field type is "string", and displays as a text input
                    .attributes({ placeholder: 'the question title' }) // you can add custom attributes, too
                    .validation({ required: true, minlength: 3, maxlength: 100 }), // add validation rules for fields
                nga.field('short_name'), // text field type translates to a textarea
                nga.field('question_type', 'choice')
                    .choices([
                        {value: "free_text", label: 'Free Text'},
                        {value: "multiple_choice", label: 'Multiple Choice'},
                    ]),
                nga.field('multiple', 'boolean'), // overriding the type allows rich text editing for the body
                nga.field('numeric', 'boolean'), // overriding the type allows rich text editing for the body
            ]);

        question.editionView()
            .title('Edit question "{{ entry.values.title }}"') // title() accepts a template string, which has access to the entry
            .actions(['list', 'show', 'delete']) // choose which buttons appear in the top action bar. Show is disabled by default
            .fields([question.creationView().fields()]);

        question.showView() // a showView displays one entry in full page - allows to display more data than in a a list
            .fields([
                question.creationView().fields(), // reuse fields from another view in another order
            ]);

        nga.configure(admin);
    });

    app.directive('postLink', ['$location', function ($location) {
        return {
            restrict: 'E',
            scope: { entry: '&' },
            template: '<p class="form-control-static"><a ng-click="displayPost()">View&nbsp;post</a></p>',
            link: function (scope) {
                scope.displayPost = function () {
                    $location.path('/show/posts/' + scope.entry().values.post_id);
                };
            }
        };
    }]);

}());
