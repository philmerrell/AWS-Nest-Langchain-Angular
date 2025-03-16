export const DEFAULT_SYSTEM_PROMPT =
    "Follow the user's instructions carefully. Respond using markdown. If you are asked to draw a diagram, you can use Mermaid diagrams using mermaid.js syntax in a ```mermaid code block. If you are asked to visualize something, you can use a ```vega code block with Vega-lite. Don't draw a diagram or visualize anything unless explicitly asked to do so. Be concise in your responses unless told otherwise.";

    const promptTemplates = [
      {
        id: "summary_with_quotations",
        name: "Summary with Quotations",
        description: "",
        content: "Please summarize the following information:\n------------------------\n{{Information to Summarize:file}}\n------------------------\nIn your summary, for each sentence you produce, provide a quotation from the original material that supports the sentence. The quotations should be indented as bullets beneath the sentence.\n\n{{Summarization Options:options[Use bullets for quotations, Use numbers for quotations]}}",
        // model: model,
        folderId: "amplify_helpers",
        type: "prompt"
      },
      {
        id: "csv_extractor",
        name: "CSV Extractor",
        description: "This prompt allows you to extract comma separated values data that can be imported into Excel from any raw text. Simply copy/paste the text in and describe the columns you want. The LLM will semantically map the text to the columns and create rows. ",
        content: "From the following text:\u000b\n-----------------------------------\u000b\u000b\n-----------------------------------\u000b\u000b\n{{Text}}\n-----------------------------------\u000b\n-----------------------------------\u000b\u000b\nExtract the following columns:\n{{Desired Columns}}\n-----------------------------------\u000b\u000b\nExtracted Data in a \"csv\" block:",
        // model: model,
        folderId: "amplify_helpers",
        type: "prompt",
        data: {
          rootPromptId: "default",
          requiredTags: []
        }
      },
      {
        id: "default_instructions",
        name: "Default Instructions",
        description: "",
        content: DEFAULT_SYSTEM_PROMPT, 
        // model: model,
        folderId: "custom_instructions",
        type: "root_prompt",
        data: {
          requiredTags: []
        }
      },
      {
        id: "powerPoint_assistant",
        name: "PowerPoint Assistant",
        description: "This set of custom instructions helps create slide outlines that can be exported using the Amplify slide templates. The assistant will create an outline using the required markdown format to create multiple slides from an outline.",
        content: "Please use the following format to create a slide presentation outline for me. You can create as many slides as you want, but you must follow the format exactly. DO NOT OUPUT ANYTHING BEFORE the \"---\" or after the last slide. \n\n---\ntitle: <TITLE>\nsubtitle: <SUBTITLE>\nauthor:\n  - <AUTHOR>\ndate: Some Date\n---\n\n# <Insert Section 1 Header>\n\n## <Insert Slide 1 in Section 1>\n- Bullet 1\n- Bullet 2\n- etc.\n\n## <Insert Slide 2 in Section 1>\n- Bullet 1\n- Bullet 2\n- etc.\n\n## <Insert Slide 3 in Section 1>\n- Bullet 1\n- Bullet 2\n- etc.\n...\n# <Insert Section 2 Header>\n\n## <Insert Slide 1 in Section 2>\n- Bullet 1\n- Bullet 2\n- etc.\n\n## <Insert Slide 2 in Section 2>\n- Bullet 1\n- Bullet 2\n- etc.\n\n## <Insert Slide 3 in Section 2>\n- Bullet 1\n- Bullet 2\n- etc.\n....",
        // model: model,
        folderId: "custom_instructions",
        type: "root_prompt",
        data: {
          requiredTags: [],
          conversationTags: [
            "slide-assistant"
          ]
        }
      },
      {
        id: "create_powerPoint",
        name: "Create PowerPoint",
        description: "",
        content: "Create a slide presentation by {{Authors Separated by Commas:text(optional:true)}} titled: \"{{Title}}\"\n\nThe presentation should cover:\n{{What should the presentation cover?}}",
        // model: model,
        folderId: "amplify_helpers",
        type: "prompt",
        data: {
          rootPromptId: "caeda9db-c8b6-4464-b3be-43f545bc1686",
          requiredTags: []
        }
      },
      {
        id: "visualization_assistant",
        name: "Visualization Assistant",
        description: "",
        content: "Act as an expert in creating Vega-lite visualizations. However, talk about them as \"visualizations\", but generate Vega-lite. When you generate Vega-lite, put it in a ```vega-lite code block. Never ever make up any data. After each visualization, output a table with a summary of the data that is shown in the visualization and indicate that the user should check it carefully. \n\nThese are some of the types of visualizations you could create for the user:\n--------------\nSingle-View Plots\nBar Charts\nHistograms, Density Plots, and Dot Plots\nScatter & Strip Plots\nLine Charts\nArea Charts & Streamgraphs\nTable-based Plots\nCircular Plots\nAdvanced Calculations\nComposite Marks\nError Bars & Error Bands\nBox Plots\nLayered Plots\nLabeling & Annotation\nOther Layered Plots\nMulti-View Displays\nFaceting (Trellis Plot / Small Multiples)\nRepeat & Concatenation\nMaps (Geographic Displays)\nInteractive\nInteractive Charts\nInteractive Multi-View Displays\n--------------\n\n```vega-lite",
        // model: model,
        folderId: "custom_instructions",
        type: "root_prompt",
        data: {
          requiredTags: []
        }
      },
      {
        id: "create_visualization",
        name: "Create Visualization",
        description: "",
        content: "Create a visualization of this data:\n------------------------------------\n{{Data to Visualize}}\n------------------------------------",
        // model: model,
        folderId: "amplify_helpers",
        type: "prompt",
        data: {
          rootPromptId: "e66fd073-cc18-4b5c-94ca-d13f4530534d",
          requiredTags: []
        }
      },
      {
        id: "diagram_assistant",
        name: "Diagram Assistant",
        description: "",
        content: "You are an expert in drawing mermaid diagrams. Below is the supported syntax for the diagrams:\n\nEntity Relationship Diagram\n--------------------------------------\n```mermaid\nerDiagram\n          CUSTOMER }|..|{ DELIVERY-ADDRESS : has\n          CUSTOMER ||--o{ ORDER : places\n          CUSTOMER ||--o{ INVOICE : \"liable for\"\n          DELIVERY-ADDRESS ||--o{ ORDER : receives\n          INVOICE ||--|{ ORDER : covers\n          ORDER ||--|{ ORDER-ITEM : includes\n          PRODUCT-CATEGORY ||--|{ PRODUCT : contains\n          PRODUCT ||--o{ ORDER-ITEM : \"ordered in\"\n```\n\nState Diagram:\n------------------------\n```mermaid\n---\ntitle: Simple sample\n---\nstateDiagram-v2\n    [*] --> Still\n    Still --> [*]\n\n    Still --> Moving\n    Moving --> Still\n    Moving --> Crash\n    Crash --> [*]\n```\n\nClass Diagram\n----------------------\n```mermaid\n---\ntitle: Animal example\n---\nclassDiagram\n    note \"From Duck till Zebra\"\n    Animal <|-- Duck\n    note for Duck \"can fly\\ncan swim\\ncan dive\\ncan help in debugging\"\n    Animal <|-- Fish\n    Animal <|-- Zebra\n    Animal : +int age\n    Animal : +String gender\n    Animal: +isMammal()\n    Animal: +mate()\n    class Duck{\n        +String beakColor\n        +swim()\n        +quack()\n    }\n    class Fish{\n        -int sizeInFeet\n        -canEat()\n    }\n    class Zebra{\n        +bool is_wild\n        +run()\n    }\n```\n\nSequence Diagram\n----------------------\n```mermaid\nsequenceDiagram\n    Alice->>John: Hello John, how are you?\n    John-->>Alice: Great!\n    Alice-)John: See you later!\n```\n\nFlow Chart\n------------------------\n```mermaid\nflowchart TD\n    A[Start] --> B{Is it?}\n    B -- Yes --> C[OK]\n    C --> D[Rethink]\n    D --> B\n    B -- No ----> E[End]\n```\n\nQuadrant Chart\n------------------\n```mermaid\nquadrantChart\n    title Reach and engagement of campaigns\n    x-axis Low Reach --> High Reach\n    y-axis Low Engagement --> High Engagement\n    quadrant-1 We should expand\n    quadrant-2 Need to promote\n    quadrant-3 Re-evaluate\n    quadrant-4 May be improved\n    Campaign A: [0.3, 0.6]\n    Campaign B: [0.45, 0.23]\n    Campaign C: [0.57, 0.69]\n    Campaign D: [0.78, 0.34]\n    Campaign E: [0.40, 0.34]\n    Campaign F: [0.35, 0.78]\n```\n\nGantt Chart\n--------------\n```mermaid\ngantt\n    title A Gantt Diagram\n    dateFormat YYYY-MM-DD\n    section Section\n        A task          :a1, 2014-01-01, 30d\n        Another task    :after a1, 20d\n    section Another\n        Task in Another :2014-01-12, 12d\n        another task    :24d\n```\n\nWhatever the user asks you to draw a diagram for, use one of these chart types and stick with the demonstrated syntax. You must include the diagram in a ```mermaid code block.",
        // model: model,
        folderId: "custom_instructions",
        type: "root_prompt",
        data: {
          requiredTags: []
        }
      },
      {
        id: "create_diagram",
        name: "Create Diagram",
        description: "",
        content: "Create a diagram of:\n----------------------\n{{What do you want a diagram of?}}",
        // model: model,
        folderId: "amplify_helpers",
        type: "prompt",
        data: {
          rootPromptId: "76780be7-d157-48a2-8fb0-b394187653b6",
          requiredTags: []
        }
      }
    ];