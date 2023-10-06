# :film_strip: `casette` - k6 like load testing using Deno

cassette (pronounced kə-sĕt′, kă-, like cassette in french) is a modern load testing
tool using JavaScript and [Deno][deno], inspired by [k6][k6].

## Why ?

[k6][k6] is a great tool but it's lacking of libraries and community due to its
custom JavaScript VM and API. Worse, there are edge cases where the VM isn't
standard and can not be. This can lead to frustration.

Therefore here are goals of this _toy_ project:

- great performance (comparable to [k6][k6])
- write [k6][k6] like scripts with VU & executors
- web APIs that feels like home
- web modules support
- Modern JavaScript & TypeScript support out of the box (including `async` /
  `await`)

This project is based on [Deno][deno] to provide the best DX experience out of
the box.

## Contributing

If you want to contribute to `cassette` to add a feature or improve the code contact
me at [negrel.dev@protonmail.com](mailto:negrel.dev@protonmail.com), open an
[issue](https://github.com/negrel/k7/issues) or make a
[pull request](https://github.com/negrel/k7/pulls).

## :stars: Show your support

Please give a :star: if this project helped you!

[![buy me a coffee](.github/images/bmc-button.png)](https://www.buymeacoffee.com/negrel)

## :scroll: License

MIT © [Alexandre Negrel](https://www.negrel.dev/)

[k6]: https://k6.io/
[deno]: https://deno.land/
