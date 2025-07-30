# Dangerous Nanthy (Modernized)
>A web clone of the classic DOS game Dangerous Dave, with a twist!
>
>**Note:** This version has been modernized to work with Node.js v22+ and no longer requires Bower.
#### Inside Node Webkit
![Dangerous Nanthy](https://cloud.githubusercontent.com/assets/5303018/20740382/8e0d6d4a-b690-11e6-8951-d943acf4aafa.png)

### Link to live demo: [***PLAY DANGEROUS NANTHY***](https://avdaredevil.github.io/DangerousNanthy/)

> **Note:** The original Heroku demo at https://dangerous-nanthy.herokuapp.com/package/ may no longer be available.

## The stuff on the inside ~oooohhh~
* Game engine - Phaser 2 (v2.6.2) - *Using original version for compatibility*
* Build tools - Node.js v22+, Gulp 5, Babel 7
* Languages - Modern ES6+ JavaScript
* Dev server - BrowserSync for live reload

## External tooling
* Tiled, for building the tilemaps
* paint.net, GIMP, or any ***open source*** image editor of your choice, for building all the assets

## Usage

### Prerequisites
- Node.js v16 or higher (tested with Node.js v22)
- npm

### Installation

First, install all the dependencies:

```sh
npm install
```

### Development

To run the game in development mode with live reload:

```sh
npm run dev
```

This will start a development server at [http://localhost:5000](http://localhost:5000)

### Build

To build the game for production:

```sh
npm run build
```

The built files will be in the `package/` directory.

### Clean

To clean the build directory:

```sh
npm run clean
```

### Deploy to GitHub Pages

To deploy the game to GitHub Pages:

1. Build the game: `npm run build`
2. Create a `gh-pages` branch and push the `package/` directory contents:
   ```bash
   git checkout -b gh-pages
   cp -r package/* .
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin gh-pages
   ```
3. Enable GitHub Pages in your repository settings (use `gh-pages` branch)
4. Access your game at `https://avdaredevil.github.io/DangerousNanthy/`

Enjoy :smiley:

Credits:

1. Modified spritesheet from agar3s's marioPhaser project
2. Sound effect assets from soundbible.com
3. Soundtrack from http://ericskiff.com/
