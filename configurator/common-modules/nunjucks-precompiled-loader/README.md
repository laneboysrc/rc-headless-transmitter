Nunjucks (Webpack) precompiled-HTML Loader
==========================================

This module is a slight tweak of [nunjucks-html-loader][github-url].
The nunjucks-html-loader rendered the nunjucks template and returned a raw HTML
file, this module returns Common-JS module that exports the rendered HTML.

This change was needed to use a nunjucks template with the HtmlWebpackPlugin.


Usage
-----

Add this to the webpack config:.

	{
        plugins: [
            new HtmlWebpackPlugin({
                template: '!!nunjucks-precompiled!src/html/index.html'
            })
        ]
    }


[github-url]: https://github.com/ryanhornberger/nunjucks-html-loader
