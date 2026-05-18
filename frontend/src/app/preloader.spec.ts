import { removeAppPreloader } from './preloader';

describe('removeAppPreloader', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('removes the startup preloader from the page', () => {
    document.body.innerHTML = '<div id="app-preloader"></div><app-root></app-root>';

    removeAppPreloader();

    expect(document.getElementById('app-preloader')).toBeNull();
  });

  it('does nothing when the startup preloader is already missing', () => {
    document.body.innerHTML = '<app-root></app-root>';

    expect(() => removeAppPreloader()).not.toThrow();
  });
});
