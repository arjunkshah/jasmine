/**
 * Valid Phosphor icon names (from @phosphor-icons/react).
 * Used to replace invalid/non-existent icon imports with UserIcon.
 * Run `node scripts/generate-phosphor-icons.mjs` to regenerate from the package.
 */
const VALID = [
  'HouseIcon', 'EnvelopeIcon', 'UsersIcon', 'MagnifyingGlassIcon', 'ListIcon', 'XIcon',
  'GearIcon', 'ChatCircleIcon', 'MapPinIcon', 'CalendarBlankIcon', 'ImageIcon', 'ArrowSquareOutIcon',
  'CaretDownIcon', 'CaretUpIcon', 'CaretRightIcon', 'CaretLeftIcon', 'TrashIcon', 'PencilIcon',
  'MinusIcon', 'HeartIcon', 'ShareNetworkIcon', 'LockIcon', 'LockOpenIcon', 'EyeIcon', 'EyeSlashIcon',
  'BellIcon', 'GiftIcon', 'ShoppingCartIcon', 'UserIcon', 'CheckIcon', 'StarIcon', 'ArrowRightIcon',
  'PhoneIcon', 'PlusIcon', 'InfoIcon', 'WarningIcon', 'QuestionIcon', 'ArrowLeftIcon',
  'CaretCircleDownIcon', 'CaretCircleUpIcon', 'CaretCircleRightIcon', 'CaretCircleLeftIcon',
  'DownloadSimpleIcon', 'UploadSimpleIcon', 'LinkIcon', 'CopyIcon', 'ClipboardIcon',
  'MagnifyingGlassMinusIcon', 'MagnifyingGlassPlusIcon', 'FunnelIcon', 'SlidersHorizontalIcon',
  'DotsThreeIcon', 'DotsThreeVerticalIcon', 'PauseIcon', 'PlayIcon', 'StopIcon',
  'EnvelopeSimpleIcon', 'PhoneCallIcon', 'AddressBookIcon', 'CalendarIcon', 'ClockIcon',
  'FileIcon', 'FileTextIcon', 'FolderIcon', 'FolderOpenIcon', 'PaperclipIcon',
  'ArrowSquareInIcon', 'ArrowSquareUpIcon', 'ArrowSquareDownIcon', 'SignOutIcon', 'SignInIcon',
  'RocketLaunchIcon', 'SparkleIcon', 'LightningIcon', 'PaletteIcon', 'CodeIcon',
];
export const PHOSPHOR_VALID_ICONS = new Set(VALID);
