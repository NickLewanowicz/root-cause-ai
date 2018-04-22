import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('root-cause-analysis', 'Integration | Component | root cause analysis', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{root-cause-analysis}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#root-cause-analysis}}
      template block text
    {{/root-cause-analysis}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
