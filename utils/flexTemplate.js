// utils/flexTemplate.js

export function createStoryFlex({ storyText, imageUrl }) {
  return {
    type: 'flex',
    altText: 'StoryForge ストーリーが届きました',
    contents: {
      type: 'bubble',
      hero: imageUrl
        ? {
            type: 'image',
            url: imageUrl,
            size: 'full',
            aspectRatio: '1.51:1',
            aspectMode: 'cover',
          }
        : undefined,
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: storyText,
            wrap: true,
            size: 'md',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        spacing: 'md',
        contents: [
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'message',
              label: 'A を選ぶ',
              text: 'A',
            },
            color: '#3D8BFF',
          },
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'message',
              label: 'B を選ぶ',
              text: 'B',
            },
            color: '#34C759',
          },
        ],
      },
    },
  };
}
