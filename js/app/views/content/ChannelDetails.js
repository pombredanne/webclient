/*
 * Copyright 2012 buddycloud
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define(function(require) {
  require(['jquery', 'timeago']);
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Channel = require('models/Channel');
  var ChannelList = require('views/content/ChannelList');
  var l10n = require('l10n');
  var l10nBrowser = require('l10n-browser');
  var template = require('text!templates/content/channelDetails.html');
  var l = l10n.get;
  var localTemplate;

  var ChannelDetails = Backbone.View.extend({
    className: 'channelDetails hidden',
    events: {'click .infoToggle': '_toggleInfo'},

    initialize: function() {
      if (!localTemplate) localTemplate = l10nBrowser.localiseHTML(template, {});
      this._fetchDetailsLists();
      this._fetchMetadata();
      if (this.options.user.subscribedChannels) {
        this.listenTo( this.options.user.subscribedChannels, 'subscriptionSync', this._updateFollowersList);
      }
    },

    _fetchDetailsLists: function() {
      this.model = new Channel(this.options.channel);
      this.listenTo(this.model, 'fetch', this.render);
      this.model.fetch({credentials: this.options.user.credentials});
    },

    _fetchMetadata: function() {
      this.metadata = this.options.user.metadata(this.options.channel);
      this.listenTo(this.metadata, 'change', this.render);
      if (!this.metadata.hasEverChanged()) {
        this.metadata.fetch({credentials: this.options.user.credentials});
      } else {
        this.render();
      }
    },

    destroy: function() {
      this.remove();
    },

    _updateFollowersList: function(action) {
      if (this._isInitialized()) {
        var username = this.options.user.username();
        if (action === 'subscribedChannel') {
          this._addFollower(username);
        } else {
          this._removeFollower(username);
        }
        this.followersList.render();
      }
    },

    _addFollower: function(username) {
      this.followersList.addItem(username);
    },

    _removeFollower: function(username) {
      this.followersList.removeItem(username);
    },

    render: function() {
      this.$el.html(_.template(localTemplate, 
        {metadata: this.metadata}));
      return this;
    },

    _renderChannelLists: function() {
      var $holder = this.$('.holder');

      this._populateChannelLists();
      this.producerList.render();
      this.moderatorsList.render();
      this.followersList.render();
      this.similarList.render();
      $holder.append(this.producerList.el);
      $holder.append(this.moderatorsList.el);
      $holder.append(this.followersList.el);
      $holder.append(this.similarList.el);
    },

    _populateChannelLists: function() {
      // Followers
      var types = this.model.followers.byType();
      var producer = (types['owner'] || []);
      var moderators = (types['moderator'] || []);
      var followers = (types['publisher'] || []).concat(types['member'] || []);
      this.producerList.model = producer;
      this.moderatorsList.model = moderators;
      this.followersList.model = followers;

      // Similar Channels
      this.similarList.model = this.model.similarChannels.usernames();
    },

    _isInitialized: function() {
      return this.producerList && this.moderatorsList && this.followersList;
    },

    _toggleInfo: function() {
      this.$el.toggleClass('hidden');
      if (!this._isInitialized()) {
        this.producerList = new ChannelList({title: l('producerList', {}, 'producer'), role: l('producerCaps', {}, 'Producer')});
        this.moderatorsList = new ChannelList({title: l('moderatorsList', {}, 'moderators'), role: l('moderatorCaps', {}, 'Moderator')});
        this.followersList = new ChannelList({title: l('followersList', {}, 'followers'), role: l('followerCaps', {}, 'Follower')});
        this.similarList = new ChannelList({title: l('similarList', {}, 'similar'), role: l('similarCaps', {}, 'Similar')});

        this._renderChannelLists();
      }
    }
  });

  return ChannelDetails;
});
