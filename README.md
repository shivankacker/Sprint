# Sprint

![logo](https://cdn.discordapp.com/attachments/656529142166323202/955886898902081596/sprint_200.png)

<br> 
Sprint, as the name suggests, is a markup language that can be written blazingly faster than its alternatives.
Sprint revises how one writes HTML for webpages and eliminates the use of tag breaks and class and id declaration as properties. Each code block is identified with it's indentation level.

## Example

Here is some sample Sprint code along with what it displays on the web page

 ```
:#main style = "display:flex;align-items:center;text-align:center;justify-content:center;height:100vh;"
    :.main-wrapper
        :h1
            This looks like a normal webpage, built with normal HTML.

        :span.sample-span style="color:red;font-size:20px;"
            But what if I say otherwise?

        :br

        :img src="rock.jpg" style="width:250px;"

 ```
![sampleOutput](https://cdn.discordapp.com/attachments/656529142166323202/931614055557382185/unknown.png)

## Usage 

### Loading the Sprint compiler script

Currently the only way of loading Sprint is through loading the Sprint compiler script along with jquery on an html document.

Put this in `index.html`

```
<script src="/path/to/jquery.js">
<script src="sprint.js">
```

### Creating an Sprint file

In the project directory, create a file called `test.spr`.
<br>
`.spr` is the file extension for all Sprint files. Put your Sprint code in this file.

### Loading the Sprint file

Sprint can only be loaded as a component for now. To create a component, go back to `index.spr` and add the following

```
<div __sprint_dev = "test">
</div>
```
This creates a dev component that hot reloads with changes. For production, remove the "_dev".

Now, the file `test.spr` will be printed to the initialized element in `index.html`

## Syntax

With Sprint, there is no need for you to begin and end tags with the &lt; and &gt; symbols. To start an element block, you have to just use a colon at the beginning of the line.
For example, here is some normal html.

```
<div class="normal-div" style="color:red;height:300px;">
    Hello World!
</div>
```
If we write the following in Sprint, we will get

```
:.normal-div color="red" height="300px"
    Hello World!
```

You might have noticed that we eliminated the need for you to write `div` entirely. Also, we did not specify class and style attributes but rather style properties as their own attributes. Sprint has significantly reduced the need to write more code.

There is no need to mention Class and Id properties in Sprint. `:element.class` and `:element#id` will suffice. If the element is a div, `:.class` and `:#id` will work just fine. 

## Current Limitations

Sprint is currently a mere proof of concept, and has certain limitations.

### **Native Loading**

Currently, Sprint loads an external spr file through ajax, parses it, and prints it in html form into an element on the webpage. This is possible to counter, by parsing and displaying it as html through server side javascript.

### **No Embeds**

Embedded scripts and styles do not work. However, external files behave as they should.

### **Wont load with :html, :head and :body tags**

Because the content is copied onto existing html, head and body tags, new tags cannot be created. Adding these tags to your Sprint file might result in instability and other issues.