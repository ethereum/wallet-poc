import * as React from 'react'
import Svg, { Defs, G, LinearGradient, Path, Stop, SvgProps } from 'react-native-svg'

const CrownIcon: React.FC<SvgProps & { className?: string }> = ({
  width = 64,
  height = 64,
  ...rest
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 80 80" fill="none" {...rest}>
      <Path
        d="M66.015 37.774L61.68 25.461c-.375-1.017-1.232-1.713-2.302-1.82-.91-.107-1.82.32-2.41 1.017L49.313 34.4c-.535.696-.75 1.66-.428 2.517l.16.481a2.639 2.639 0 002.41 1.874l11.563.857c1.232.107 2.356-.643 2.784-1.82l.268-.75v.214h-.054z"
        fill="url(#crown-paint0_linear_988_1192)"
      />
      <Path
        d="M75.652 65.827l.803-7.602c-24.948-3.427-49.628-4.551-73.452.856v6.746c26.233 5.032 48.986 5.14 72.649 0z"
        fill="url(#crown-paint1_linear_988_1192)"
      />
      <Path
        d="M18.422 67.38A177.795 177.795 0 014.18 65.132v-5.943a75.32 75.32 0 013.373-.696c5.567-1.124 10.76 3.105 10.921 8.78v.107h-.053z"
        fill="#EBCACA"
        opacity={0.3}
      />
      <Path
        d="M68.532 64.971a43.76 43.76 0 00.535-2.57c.428-2.57 2.891-4.283 5.407-3.908.321 0 .59.107.91.16l-.642 6.96c-2.249.536-4.444 1.018-6.692 1.392.16-.642.321-1.338.482-2.034z"
        fill="#FAF3F3"
        style={{ mixBlendMode: 'soft-light' }}
      />
      <Path
        d="M64.623 36.864c-1.766-5.246-4.283-11.028-5.675-13.17h.429c1.07.107 1.927.803 2.302 1.82l3.64 10.387-.75.963h.054z"
        fill="url(#crown-paint2_linear_988_1192)"
      />
      <Path
        d="M31.645 36.168l-7.227-10.707a2.745 2.745 0 00-2.677-1.178c-.91.16-1.713.75-2.034 1.606l-4.872 11.243c-.375.803-.268 1.767.214 2.516l.268.375A2.72 2.72 0 0018.1 41.2l11.296-2.142c1.231-.214 2.088-1.231 2.195-2.462v-.75l.107.214-.054.107z"
        fill="url(#crown-paint3_linear_988_1192)"
      />
      <Path
        d="M63.285 35.793l.375 2.248-9.476 1.392-2.89-2.623 11.991-1.017z"
        fill="url(#crown-paint4_linear_988_1192)"
      />
      <Path
        d="M16.762 35.9l-.375 2.249 9.209 1.338 2.783-2.57L16.762 35.9z"
        fill="url(#crown-paint5_linear_988_1192)"
      />
      <Path
        d="M76.776 17.698l1.874.107-4.658 19.808-10.921.964-.75-2.998c-.32-1.392 0-2.89.964-3.962l11.136-12.902a2.844 2.844 0 012.355-1.017z"
        fill="url(#crown-paint6_linear_988_1192)"
      />
      <Path
        d="M15.477 35.74l4.23-9.798a2.715 2.715 0 012.034-1.606c.428-.053.856 0 1.284.107-3.105 2.73-5.728 11.618-5.728 11.618l-1.82-.322z"
        fill="url(#crown-paint7_linear_988_1192)"
      />
      <Path
        d="M2.95 16.038l-1.446.161L6.59 37.025l11.778 1.07.59-3.854a4.217 4.217 0 00-.911-3.266L6.216 17.055c-.804-.91-1.767-1.177-3.213-1.124l-.053.107z"
        fill="url(#crown-paint8_linear_988_1192)"
      />
      <Path
        d="M3.003 60.473v-1.392c23.824-5.407 48.504-4.336 73.452-.857l-.16 2.517c-23.824 4.657-47.059 4.55-73.345-.268h.053z"
        fill="#991E1E"
        opacity={0.7}
      />
      <Path
        d="M76.401 58.6c-9.743 2.57-20.45 3.05-20.45 3.05l14.294-4.228c2.034.267 4.122.535 6.156.803v.374zM35.606 62.08c-7.87.642-26.714-2.088-32.603-2.945 3.158-.696 6.37-1.338 9.53-1.82l23.073 4.765z"
        fill="#991E1E"
        opacity={0.7}
      />
      <Path
        d="M72.868 58.867l.75-13.437-67.83.856v12.528c24.198 5.032 45.237 5.14 67.08 0v.053z"
        fill="url(#crown-paint9_linear_988_1192)"
      />
      <Path
        d="M69.067 57.047l-.16 1.178c-.108.91-1.553 1.606-3.534 1.82-.964.107-1.874.16-2.838.268-3.693.321-6.584-1.5-4.604-2.891 1.125-.803 2.463-1.446 3.855-1.98 2.945-1.072 7.388 0 7.174 1.659l.107-.054z"
        fill="#D14F4F"
        opacity={0.2}
      />
      <Path
        d="M6.215 51.212c3.052 0 5.514 2.57 5.514 5.728 0 3.16-.267 2.088-.803 2.945-1.552-.268-3.105-.589-4.71-.91v-7.763z"
        fill="#EBCACA"
        opacity={0.3}
      />
      <Path
        d="M35.071 56.886c10.172 0 18.898 1.928 22.7 4.712-14.08 1.766-28.214 1.392-43.472-1.125 4.39-2.141 12.046-3.587 20.772-3.587z"
        fill="#FAF3F3"
        opacity={0.5}
      />
      <Path
        d="M17.993 31.029c.214.268.428.589.589.91-1.606 0-3.855-.107-4.604-.535-.535-.322-.91-3.16-1.124-6.371l5.14 6.05v-.054zM68.692 25.354l3.32-3.855c.107 2.302 0 5.675 0 7.013 0 1.339-2.142-1.231-3.32-3.159zM63.285 31.617l3.426-3.962c.482 2.195 1.124 5.408 1.124 6.103 0 .697-2.57.482-5.3-1.017.161-.428.429-.803.696-1.124h.054z"
        fill="#FAF3F3"
      />
      <Path
        d="M12.426 51.587l5.193 3.8c-1.178 1.339-.75 4.176-.482 5.515-.268 0-.59-.107-.857-.107.268-1.446.643-4.123.428-5.3-.32-1.713-3.8-1.232-3.8-1.232l-.536 5.89c-.214 0-.482-.108-.696-.108l.75-8.405v-.053z"
        fill="#991E1E"
        opacity={0.7}
      />
      <Path
        d="M75.598 55.227c-23.61 3.426-47.593 4.283-72.06 0L.005 18.073A1.778 1.778 0 01.97 16.36c.696-.322 1.499-.161 2.034.428l13.17 14.776c.375.428.535.964.375 1.499l-.482 2.302a1.725 1.725 0 001.499 2.088l7.441.75c1.125.106.964-.697.75-2.089l-.428-2.355c-.107-.535 0-1.124.267-1.606l12.688-20.88c.375-.588.964-.963 1.66-.91h.59c.588 0 1.123.375 1.445.91l13.17 20.933c.374.59.428 1.339.16 2.035l-.482 1.285c-.535 1.445-.856 2.783.429 2.676l7.548-.75c.91-.106 1.606-.856 1.553-1.766V34.67a1.41 1.41 0 01.321-1.124l12.26-15.098c.374-.481 1.017-.695 1.606-.588.91.16 1.552.963 1.445 1.873L75.652 55.28l-.054-.053z"
        fill="url(#crown-paint10_linear_988_1192)"
      />
      <Path
        d="M57.771 41.147c.321-.803 1.392-2.088 2.837-3.48l2.195-.214c.91-.107 1.606-.857 1.553-1.767V34.67v-.375c2.677-2.248 5.193-3.908 5.354-3.212.32 1.178-3.427 17.774-5.14 25.59-3.32.375-6.585.643-9.904.91.75-4.764 2.356-14.347 3.159-16.382l-.054-.053z"
        fill="#D14F4F"
        opacity={0.2}
      />
      <Path
        d="M5.466 54.584L2.468 22.677c0-.535.214-1.07.696-1.392 2.945 4.497 6.639 10.493 8.138 13.223 2.302 4.123 3.8 11.404 5.942 21.683A146.75 146.75 0 015.52 54.584h-.054z"
        fill="#EBCACA"
        opacity={0.3}
      />
      <Path
        d="M78.596 17.805c.857.161 1.446.964 1.339 1.874l-4.337 35.548c-2.623.375-5.246.75-7.923 1.018 0-11.19 4.443-32.497 10.868-38.44h.053z"
        style={{ mixBlendMode: 'soft-light' }}
        fill="#FAF3F3"
      />
      <Path
        d="M38.658 57.422c14.509 0 31.64-1.445 37.743-8.94l-.803 6.799c-23.61 3.426-47.593 4.282-72.06 0l-.481-5.194c7.12 5.247 22.753 7.389 35.655 7.389l-.054-.054z"
        fill="#991E1E"
        opacity={0.7}
      />
      <Path
        d="M55.2 34.669a3.71 3.71 0 00-.267-.696L41.977 13.362c-.321-.536-.857-.857-1.392-.857h-.589c-.642 0-1.231.268-1.606.91L25.916 33.973c-.16.321-.268.642-.321.964l-.214-1.178c-.107-.535 0-1.124.267-1.606l12.689-20.88c.374-.588.963-.963 1.66-.91h.588c.589 0 1.124.375 1.446.91L55.2 32.207c.374.59.428 1.339.16 2.035l-.16.428z"
        fill="url(#crown-paint11_linear_988_1192)"
      />
      <Path
        d="M47.17 47.25c.536-.91 7.389-9.904 5.943-13.705-1.445-3.801-11.564-19.809-12.956-18.203-1.445 1.606-12.42 15.151-12.955 18.578-.536 3.426 3.8 14.615 4.871 14.615 1.071 0 5.193-3.105 8.673-3.426 3.855-.322 6.478 2.141 6.478 2.141h-.053z"
        fill="#FAF3F3"
        opacity={0.5}
        style={{ mixBlendMode: 'soft-light' }}
      />
      <Path
        d="M47.385 53.46l-.16-12.313-1.928-2.142-11.029-.321-2.034 2.302v13.277l2.248 1.98 10.815-.16 2.088-2.623z"
        fill="url(#crown-paint12_linear_988_1192)"
      />
      <Path
        d="M39.033 42.86c-2.837 0-5.354 2.355-6.799 5.942v-7.816l2.088-2.302 11.028.321 1.874 2.142.16 12.26-.267.374c-.696-6.21-4.069-10.975-8.084-10.975v.054z"
        fill="#731717"
        opacity={0.8}
      />
      <Path
        d="M39.247 10.684s1.446 4.551-5.14 8.888c1.875-4.07 3.641-7.388 5.14-8.888zM26.773 57.903c-3.533-.32-9.636 2.249.429 2.356 10.118.107 5.942-1.713-.429-2.356zM73.028 55.87l-.16 2.997c-.322.054-.643.16-.964.214-.964-.32-1.606-.856-1.606-1.445 0-.589 1.178-1.5 2.73-1.767z"
        fill="#FAF3F3"
      />
      <Path
        d="M75.813 64.06l-.16 1.767c-23.664 5.14-46.47 5.033-72.65 0v-1.82c12.957 2.41 25.538 4.925 37.423 4.979 12.099 0 23.502-2.463 35.44-4.925h-.053z"
        fill="#991E1E"
        opacity={0.7}
      />
      <Path
        d="M54.29 64.757c8.834.695-4.978 3.533-15.792 3.8-10.815.268-16.329-2.783-16.061-3.426.267-.642 22.913-1.07 31.8-.374h.054z"
        fill="#FAF3F3"
        opacity={0.5}
      />
      <Path
        d="M31.645 65.346c3.105.428 4.122-1.125 1.285-1.125-2.838 0-3.427.803-1.285 1.125z"
        fill="#FAF3F3"
      />
      <Path
        d="M34.375 55.709l10.868-.16 2.088-2.678-.16-11.778.053.054.16 12.313-2.087 2.623-10.814.161-2.249-1.98v-.483l2.141 1.928z"
        fill="url(#crown-paint13_linear_988_1192)"
      />
      <Path
        d="M33.894 42.325v-.107l1.552-2.035 4.07.16 4.122.161.696.91.695.964.643 10.708-1.66 2.302-8.833.16-1.82-1.713v-.375l.535-11.135z"
        fill="#731717"
        opacity={0.8}
      />
      <Path
        d="M45.297 52.122l-.107-9.797-1.499-1.767-8.459-.268-1.606 1.874v10.6l1.714 1.606 8.351-.107 1.606-2.141z"
        fill="url(#crown-paint14_linear_988_1192)"
      />
      <Path
        d="M35.607 50.998l1.124 1.07 5.568-.107 1.017-1.445 1.981 1.499v.107l-1.606 2.141-8.351.107-1.714-1.606v-.267l1.981-1.5z"
        fill="#731717"
        opacity={0.8}
      />
      <Path
        d="M36.73 52.068l5.569-.107 1.391 2.302-8.351.107 1.392-2.302z"
        fill="#731717"
        opacity={0.3}
        style={{ mixBlendMode: 'soft-light' }}
      />
      <Path
        d="M43.316 50.516l-.054-6.532-.963-1.178-5.675-.16-1.017 1.231v7.12l1.124 1.071 5.568-.107 1.017-1.445z"
        fill="#FAF3F3"
        style={{ mixBlendMode: 'soft-light' }}
      />
      <Path
        d="M35.232 40.29l8.458.268 1.5 1.767v.053l-1.285 1.713-.643.054v-.16l-.964-1.178-5.674-.161-1.018 1.231v.375H35.5l-1.873-2.034v-.054l1.606-1.874z"
        fill="#FAF3F3"
      />
      <Path
        opacity={0.8}
        d="M35.232 40.29l8.458.268-1.392 2.248-5.674-.16-1.392-2.356z"
        fill="#FAF3F3"
      />
      <Path
        d="M43.155 50.783l-.107-6.585-.91-1.07-5.3-.107-1.07 1.177-.161 4.176v-4.497l1.017-1.231 5.675.16.963 1.178.054 6.532-.482.696.321-.429z"
        fill="#FAF3F3"
        opacity={0.8}
      />
      <Path
        d="M36.999 51.747c-.16-.803-1.392-.643-1.392-.643l1.124 1.017s.321-.214.268-.32v-.054zM36.731 42.646l3.747.107s-1.017-1.231-1.98-1.553c-.964-.32-1.767 1.446-1.767 1.446zM39.836 38.203l-5.193-.161s.696-1.124 1.927-1.232c1.232-.107 3.32 1.392 3.32 1.392h-.054z"
        fill="#FAF3F3"
      />
      <Path
        d="M48.562 40.825c0 .268.215 12.474.215 12.474s.428-5.46.481-6.103c0-.642-.696-6.424-.696-6.424v.053z"
        fill="url(#crown-paint15_linear_988_1192)"
      />
      <Path
        d="M30.467 49.338c0-.214-.214-10.868-.214-10.868s-.428 4.765-.482 5.3c0 .535.696 5.568.696 5.568z"
        fill="url(#crown-paint16_linear_988_1192)"
      />
      <Path
        d="M16.601 33.063l-.482 2.302a1.76 1.76 0 00.964 1.927l-4.443 7.174s3.212-9.476 3.961-11.885v.482z"
        fill="url(#crown-paint17_linear_988_1192)"
      />
      <Path
        d="M62.75 37.453c.91-.107 1.606-.857 1.552-1.767V34.67v-.482c.214 2.838.535 6.585.535 6.692 0 .214.161 7.442.161 7.442s-.696-4.337-.696-4.926c0-.589-1.285-4.818-1.606-5.889l.053-.053z"
        fill="url(#crown-paint18_linear_988_1192)"
      />
      <G
        style={{
          mixBlendMode: 'multiply'
        }}
        opacity={0.7}
        fill="#991E1E"
      >
        <Path d="M56.86 68.825c-.374 0-.695.054-1.07.107.268-3.8-1.285-7.12-1.285-7.12s1.981 2.088 2.302 7.013h.054zM47.545 66.577l-.267 2.89h-1.339c.75-1.391 1.606-2.944 1.606-2.944v.054z" />
      </G>
      <Path
        d="M33.626 21.125s-2.57 3.694-1.927 3.694c.642 0 4.175-4.551 1.927-3.694z"
        fill="#FAF3F3"
      />
      <Defs>
        <LinearGradient
          id="crown-paint0_linear_988_1192"
          x1={55.3069}
          y1={48.4294}
          x2={60.4349}
          y2={20.9855}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#D14F4F" />
          <Stop offset={1} stopColor="#F7BA2F" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint1_linear_988_1192"
          x1={69.2714}
          y1={58.0811}
          x2={29.8718}
          y2={63.68}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FF9600" />
          <Stop offset={1} stopColor="#FFA900" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint2_linear_988_1192"
          x1={61.09}
          y1={42.5391}
          x2={62.8567}
          y2={21.6064}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#991E1E" />
          <Stop offset={1} stopColor="#D14F4F" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint3_linear_988_1192"
          x1={24.076}
          y1={50.2751}
          x2={22.0534}
          y2={22.789}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#D14F4F" />
          <Stop offset={1} stopColor="#F7BA2F" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint4_linear_988_1192"
          x1={57.5035}
          y1={35.8463}
          x2={57.1823}
          y2={56.1365}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#F7BA2F" />
          <Stop offset={1} stopColor="#EBE1CA" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint5_linear_988_1192"
          x1={6.4295}
          y1={35.9539}
          x2={6.75072}
          y2={56.1907}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#F7BA2F" />
          <Stop offset={1} stopColor="#EBE1CA" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint6_linear_988_1192"
          x1={75.866}
          y1={38.8983}
          x2={71.2619}
          y2={28.9941}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#F7BA2F" />
          <Stop offset={1} stopColor="#EBE1CA" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint7_linear_988_1192"
          x1={18.1536}
          y1={42.967}
          x2={19.8132}
          y2={22.9979}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#991E1E" />
          <Stop offset={1} stopColor="#D14F4F" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint8_linear_988_1192"
          x1={13.8712}
          y1={19.09}
          x2={5.57307}
          y2={36.1145}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#F7BA2F" />
          <Stop offset={1} stopColor="#EBE1CA" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint9_linear_988_1192"
          x1={67.479}
          y1={48.7501}
          x2={30.5984}
          y2={54.0498}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#D14F4F" />
          <Stop offset={1} stopColor="#F7BA2F" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint10_linear_988_1192"
          x1={75.6486}
          y1={49.6871}
          x2={7.86592}
          y2={23.7923}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FF9600" />
          <Stop offset={1} stopColor="#FFA900" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint11_linear_988_1192"
          x1={40.3173}
          y1={36.5963}
          x2={40.0496}
          y2={53.5673}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#F7BA2F" />
          <Stop offset={1} stopColor="#EBE1CA" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint12_linear_988_1192"
          x1={39.7826}
          y1={56.2438}
          x2={39.7826}
          y2={38.6838}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#D14F4F" />
          <Stop offset={1} stopColor="#F7BA2F" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint13_linear_988_1192"
          x1={39.7826}
          y1={56.244}
          x2={39.7826}
          y2={41.0933}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#F7BA2F" />
          <Stop offset={1} stopColor="#EBE1CA" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint14_linear_988_1192"
          x1={39.4619}
          y1={54.3705}
          x2={39.4619}
          y2={40.2904}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#731717" />
          <Stop offset={1} stopColor="#D14F4F" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint15_linear_988_1192"
          x1={49.2583}
          y1={47.0354}
          x2={48.5623}
          y2={47.0354}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#D14F4F" />
          <Stop offset={1} stopColor="#F7BA2F" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint16_linear_988_1192"
          x1={30.4673}
          y1={44.0377}
          x2={32.8229}
          y2={46.9823}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#D14F4F" />
          <Stop offset={1} stopColor="#F7BA2F" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint17_linear_988_1192"
          x1={12.4789}
          y1={44.4126}
          x2={14.888}
          y2={39.1125}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#D14F4F" />
          <Stop offset={1} stopColor="#F7BA2F" />
        </LinearGradient>
        <LinearGradient
          id="crown-paint18_linear_988_1192"
          x1={63.2313}
          y1={33.0093}
          x2={65.2657}
          y2={49.8197}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#D14F4F" />
          <Stop offset={1} stopColor="#F7BA2F" />
        </LinearGradient>
      </Defs>
    </Svg>
  )
}

export default CrownIcon
