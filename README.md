# InterSystems ObjectScript Class View

This extension boosts the [InterSystems ObjectScript Extension Pack](https://marketplace.visualstudio.com/items?itemName=intersystems-community.objectscript-pack) by adding a powerful new way to navigate your class definitions.

## Installation

The extension is published on [Marketplace](https://marketplace.visualstudio.com/items?itemName=georgejames.objectscript-class-view). Either install it from there, or search for its identifier `georgejames.objectscript-class-view` in the Extensions view of [VS Code](https://code.visualstudio.com/Download).

## Features

Use one of the following VS Code commands to populate its **Implementations** feature with information about the current class, icluding inherited properties, methods, parameters and other class members.
- `References: Find All Implementations`
- `Go to Implementations`
- `Peek Implementations`

These commands are available on the context menu of a class you have opened in an editor. They can also be run from Command Palette or via keyboard shortcuts.

A quirk of VS Code means the extension is not notified of your request if the cursor is on a blank line of the class definition. The workaround is to move the cursor up or down to a line containing text.

`Find All Implementations` displays its results in the References view alongside your code.

<video controls src="https://github.com/gjsjohnmurray/vscode-objectscript-class-view/raw/HEAD/media/README/OSCV-side.mp4" type="video/mp4">
</video>


The other commands uses the [peeked editor](https://code.visualstudio.com/Docs/editor/editingevolved#_peek) inline presentation.

<video controls src="https://github.com/gjsjohnmurray/vscode-objectscript-class-view/raw/HEAD/media/README/OSCV-peek.mp4" type="video/mp4">
</video>

In both presentations the first level of the navigation tree has a node for the class itself plus one for each superclass from which anything is inherited. In this context the superclasses are the immediate superclasses of your class plus their own superclasses recursively.

Under the class nodes are the members being contributed to your class. Naturally the entries under your class correspond to all of the class members defined in it, with the exception of those tagged Abstract or Internal.

Under each superclass node you only see non-abstract, non-internal members defined or overridden in that class and inherited by your class. Members overridden between this superclass and your class, or in your class, will not be listed.

Inheritance information is obtained from the server, so if you have made changes locally but not yet saved and compiled them they won't appear in the tree.

VS Code does not refresh these views automatically. To update the peeked editor close it an reopen it. In the other view use the Refresh button on its header.

## Known Issues

1. The InterSystems Language Server is used to locate contributed members in superclasses. If the superclass definition triggers warnings or errors these appear in VS Code's Problems panel and will remain there until you open the class (for example by clicking on one of its messages) and then close it.

## Release Notes

See the [CHANGELOG](https://marketplace.visualstudio.com/items/georgejames.objectscript-class-view/changelog) for changes in each release.

## About George James Software

Known for our expertise in InterSystems technologies, George James Software has been providing innovative software solutions for over 35 years. We focus on activities that can help our customers with the support and maintenance of their systems and applications. Our activities include consulting, training, support, and developer tools - with the Serenji debugger and Deltanji source control being our flagship tools. These tools augment InterSystems' technology and can help customers with the maintainability and supportability of their applications over the long term. 

To find out more, go to our website - [georgejames.com](https://georgejames.com) 
